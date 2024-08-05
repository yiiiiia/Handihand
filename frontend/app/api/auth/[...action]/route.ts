import { prismaClient } from "@/lib/db/data-source"
import { Profile, VERIFIED, WAIT_VERIFICATION } from "@/lib/db/entities"
import { createAccountByEmail, createOnetimeCsrfToken, deleteTokenById, findAccountByEmail, getEmailVerificationToken } from "@/lib/db/query"
import { logger } from "@/lib/logger"
import { deleteSession, getSession, newSession } from "@/lib/session"
import { profile } from "@prisma/client"
import { GaxiosResponse } from "gaxios"
import { google, people_v1 } from 'googleapis'
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
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
    const dbToken = await getEmailVerificationToken(email, token)
    if (!dbToken) {
        redirect('/not-found')
    }
    await deleteTokenById(dbToken.id)

    const validityPeriod = 5 * 60 * 1000
    const account = await findAccountByEmail(email)
    if (!account) {
        logger.error(`SYSTEM ERROR: account with email '${email}' does not exist, but it is included in a verification callback`)
        redirect('/error')
    }

    const timePassed = Math.abs(Date.now() - dbToken.created_at.getTime())
    if (timePassed > validityPeriod && account.state === WAIT_VERIFICATION) {
        // token has expired
        const csrf = await createOnetimeCsrfToken()
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
    logger.info(`gaxiosResp data: ${JSON.stringify(gaxiosResp.data)}`)

    if (!gaxiosResp.data.emailAddresses || gaxiosResp.data.emailAddresses.length == 0 || !gaxiosResp.data.emailAddresses[0].value) {
        logger.error(`can not handle google sign in, api response does not contain a user email address: ${JSON.stringify(gaxiosResp)}`)
        redirect('/error')
    }
    const email = gaxiosResp.data.emailAddresses[0].value
    const lastIndexOfAt = email.lastIndexOf('@')
    if (lastIndexOfAt === -1) {
        logger.error(`cannot handle google sign in, email address from the api response is not valid: ${email}`)
        redirect('/error')
    }

    const defaultUsername = email.substring(0, lastIndexOfAt)
    let accountId: number = -1
    await prismaClient.$transaction(async tx => {
        let account = await findAccountByEmail(email, tx)
        if (!account) {
            const newAccountId = await createAccountByEmail(email, null, true, tx)
            accountId = newAccountId[0].id
        } else {
            accountId = account.id
            if (account.state === WAIT_VERIFICATION) {
                await tx.account.update({
                    where: { id: account.id },
                    data: { state: VERIFIED }
                })
            }
        }
        if (accountId === -1) {
            throw new Error(`failed to get database account id, email: ${email}`)
        }

        const profile = extractProfile(gaxiosResp.data)
        profile.username = defaultUsername
        let dbProfile = await tx.profile.findFirst({
            where: { account_id: accountId },
            orderBy: { created_at: 'desc' }
        })
        if (!dbProfile) {
            await tx.profile.create({
                data: {
                    account_id: accountId,
                    country_code: profile.countryCode,
                    region: profile.region,
                    city: profile.city,
                    postcode: profile.postcode,
                    street_address: profile.streetAddress,
                    extended_address: profile.extendedAddress,
                    username: defaultUsername,
                    photo: profile.photo,
                    created_at: new Date()
                }
            })
        } else {
            dbProfile = patchProfile(dbProfile, profile)
            await tx.profile.update({
                where: { id: dbProfile.id },
                data: dbProfile
            })
        }
    })
    return accountId
}

function patchProfile(dbProfile: profile, profile: Profile): profile {
    if (!dbProfile.username) {
        dbProfile.username = profile.username ?? null
    }
    if (!dbProfile.photo && profile.photo) {
        dbProfile.photo = profile.photo
    }
    if (!dbProfile.country_code && profile.countryCode) {
        dbProfile.country_code = profile.countryCode
    }
    if (!dbProfile.region && profile.region) {
        dbProfile.region = profile.region
    }
    if (!dbProfile.city && profile.city) {
        dbProfile.city = profile.city
    }
    if (!dbProfile.postcode && profile.postcode) {
        dbProfile.postcode = profile.postcode
    }
    if (!dbProfile.street_address && profile.streetAddress) {
        dbProfile.street_address = profile.streetAddress
    }
    if (!dbProfile.extended_address && profile.extendedAddress) {
        dbProfile.extended_address = profile.extendedAddress
    }
    return dbProfile
}
