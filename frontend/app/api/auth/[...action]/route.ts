import { prismaClient } from "@/lib/db/data-source"
import { Profile, VERIFIED, WAIT_VERIFICATION } from "@/lib/db/entities"
import { createAccountByEmail, createOnetimeCsrfToken, deleteTokenById, findAccountByEmail, getEmailVerificationToken } from "@/lib/db/query"
import { logger } from "@/lib/logger"
import { deleteSession, getSession, newSession } from "@/lib/session"
import { profile } from "@prisma/client"
import { GaxiosResponse } from "gaxios"
import { google, people_v1 } from 'googleapis'
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { NextRequest } from "next/server"
import { googleOAuthClient } from "./oauth"

export { handler as GET, handler as POST }

async function handler(request: NextRequest, { params }: { params: { action: string[] } }) {
    if (params.action.length == 1 && params.action[0] === 'callback') {
        return handleEmailCallback(request)
    }
    if (params.action.length == 1 && params.action[0] === 'signout') {
        return handleSignout()
    }
    if (params.action.length == 2 && params.action.join('/') === 'callback/google') {
        return handleGoogleCallback(request)
    }
}

async function handleEmailCallback(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const token = searchParams.get('token')
    if (!email || !token) {
        redirect('/error')
    }
    const verify = await getEmailVerificationToken(email, token)
    if (!verify) {
        notFound()
    }

    await deleteTokenById(verify.id)
    const account = await findAccountByEmail(email)
    if (!account) {
        logger.error(`SYSTEM ERROR: account with email '${email}' does not exist, but it is included in a verification callback`)
        redirect('/error')
    }

    const timePassed = Math.abs(Date.now() - verify.created_at.getTime())
    if (timePassed > 5 * 60 * 1000 && account.state === WAIT_VERIFICATION) {
        // token has expired
        let csrf = ''
        await prismaClient.$transaction(async tx => {
            // 1. delete the old token 
            await deleteTokenById(verify.id, tx)
            // 2. create a new csrf one-time token
            csrf = await createOnetimeCsrfToken()
        })
        // redirect to the email verification page
        redirect(`/auth/verify?email=${email}&expired=true&csrf=${csrf}`)
    }

    if (account.state === WAIT_VERIFICATION) {
        await prismaClient.account.update({
            where: { id: account.id },
            data: {
                state: VERIFIED
            }
        })
    }

    await newSession(account.id)
    redirect('/')
}

async function handleSignout() {
    const session = await getSession()
    if (session) {
        deleteSession(session)
    }
    redirect('/')
}

async function handleGoogleCallback(request: NextRequest) {
    logger.info(`get Google OAuth callback: ${request.url}`)
    const { searchParams } = new URL(request.url)
    const err = searchParams.get('error')
    if (err) {
        logger.error(`Google OAuth 2.0 server response error: ${err}`)
        redirect('/error')
    }
    const state = searchParams.get('state')
    if (!state) {
        logger.error(`Google OAuth 2.0 server didn't respond with the state, Possible CSRF attack`)
        redirect('/error')
    }
    const stateInCookie = cookies().get('oauth-google-state')
    if (!stateInCookie) {
        logger.error(`couldn't find the oauth state in cookie`)
        redirect('/error')
    }
    if (stateInCookie.value !== state) {
        logger.error(`state mismatch, passed: ${state}, saved: ${stateInCookie}`)
        redirect('/error')
    }

    const code = searchParams.get('code')
    if (!code) {
        logger.error(`Google OAuth 2.0 server didn't respond with a code`)
        redirect('/error')
    }

    const oauth2Client = googleOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)
    const peopleAPI = google.people('v1')
    const peopleData = await peopleAPI.people.get({
        auth: oauth2Client,
        resourceName: 'people/me',
        personFields: 'names,addresses,emailAddresses,photos',
    })

    const account_id = await handlePeopleApiResponse(peopleData)
    if (account_id) {
        await newSession(account_id)
        redirect('/')
    } else {
        redirect('/error')
    }
}

function extractProfile(data: people_v1.Schema$Person): Profile {
    const profile: Profile = {}
    if (data.names && data.names.length > 0) {
        const dataName = data.names[0]
        profile.firstName = dataName.givenName
        profile.lastName = dataName.familyName
        profile.middleName = dataName.middleName
    }
    if (data.photos && data.photos.length > 0) {
        profile.photo = data.photos[0].url
    }
    let mainAddress: people_v1.Schema$Address | undefined
    if (data.addresses && data.addresses.length > 0) {
        mainAddress = data.addresses.find(e => e.type === 'home')
        if (!mainAddress) {
            mainAddress = data.addresses[0]
        }
        profile.countryCode = mainAddress.countryCode
        profile.region = mainAddress.region
        profile.city = mainAddress.city
        profile.postcode = mainAddress.postalCode
        profile.streetAddress = mainAddress.streetAddress
        profile.extendedAddress = mainAddress.extendedAddress
    }
    profile.createdAt = new Date()
    return profile
}

async function handlePeopleApiResponse(gaxiosResp: GaxiosResponse<people_v1.Schema$Person>): Promise<number | null> {
    if (!gaxiosResp.data.emailAddresses || gaxiosResp.data.emailAddresses.length == 0 || !gaxiosResp.data.emailAddresses[0].value) {
        logger.error(`can not handle google sign in, api response does not contain a user email address: ${JSON.stringify(gaxiosResp)}`)
        redirect('/error')
    }

    const email = gaxiosResp.data.emailAddresses[0].value
    let account_id = null
    await prismaClient.$transaction(async tx => {
        let account = await findAccountByEmail(email, tx)
        if (!account) {
            const newAccountId = await createAccountByEmail(email, null, true, tx)
            account_id = newAccountId[0].id
        } else {
            account_id = account.id
            if (account.state === WAIT_VERIFICATION) {
                await tx.account.update({
                    where: { id: account.id },
                    data: { state: VERIFIED }
                })
            }
        }

        const profile = extractProfile(gaxiosResp.data)
        let db_profile = await tx.profile.findFirst({
            where: { account_id: account_id },
            orderBy: { created_at: 'desc' }
        })
        if (db_profile) {
            db_profile = patchProfile(db_profile, profile)
        } else {
            const new_profile = {
                first_name: profile.firstName ?? null,
                last_name: profile.lastName ?? null,
                middle_name: profile.middleName ?? null,
                photo: profile.photo ?? null,
                account_id: account_id,
            }
            db_profile = await tx.profile.create({ data: new_profile })
        }
    })
    return account_id
}

function patchProfile(db_profile: profile, profile: Profile): profile {
    if (!db_profile.first_name && profile.firstName) {
        db_profile.first_name = profile.firstName
    }
    if (!db_profile.last_name && profile.lastName) {
        db_profile.last_name = profile.lastName
    }
    if (!db_profile.middle_name && profile.middleName) {
        db_profile.middle_name = profile.middleName
    }
    if (!db_profile.photo && profile.photo) {
        db_profile.photo = profile.photo
    }
    if (!db_profile.country_code && profile.countryCode) {
        db_profile.country_code = profile.countryCode
    }
    if (!db_profile.region && profile.region) {
        db_profile.region = profile.region
    }
    if (!db_profile.city && profile.city) {
        db_profile.city = profile.city
    }
    if (!db_profile.postcode && profile.postcode) {
        db_profile.postcode = profile.postcode
    }
    if (!db_profile.street_address && profile.streetAddress) {
        db_profile.street_address = profile.streetAddress
    }
    if (!db_profile.extended_address && profile.extendedAddress) {
        db_profile.extended_address = profile.extendedAddress
    }
    return db_profile
}
