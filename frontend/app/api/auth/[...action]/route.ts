import { ACCOUNT_STATE_VERIFIED, ACCOUNT_STATE_WAIT_VERIFICATION, TOKEN_ONETIME_CSRF, TOKEN_VERIFY_EMAIL, getPrismaClient } from "@/lib/data-source"
import { logger } from "@/lib/logger"
import { deleteSession, getSession, newSession } from "@/lib/session"
import { randToken } from "@/lib/util"
import { google } from 'googleapis'
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"
import { googleOAuthClient } from "./oauth"

export { handler as GET, handler as POST }

async function handler(request: NextRequest, { params }: { params: { action: string[] } }) {
    if (params.action.length === 1 && params.action[0] === 'callback') {
        return handleEmailCallback(request)
    }
    if (params.action.length === 1 && params.action[0] === 'signout') {
        return handleSignout()
    }
    if (params.action.length === 2 && params.action.join('/') === 'callback/google') {
        return handleGoogleCallback(request)
    }
}

async function handleEmailCallback(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const token = searchParams.get('token')
    if (!email || !token) {
        notFound()
    }

    const prisma = getPrismaClient()
    const tkEmailVerify = await prisma.verification.findUnique({
        where: {
            email: email,
            code: token,
            kind: TOKEN_VERIFY_EMAIL,
        },
    })
    if (!tkEmailVerify) {
        notFound()
    }

    const timePassed = Math.abs(Date.now() - tkEmailVerify.created_at.getTime())
    if (timePassed > 5 * 60 * 1000) {
        // token has expired
        const tkCsrf = await prisma.$transaction(async tx => {
            // 1. delete the old token 
            await tx.verification.delete({
                where: { id: tkEmailVerify.id }
            })
            // 2. create a new csrf one-time token
            const tkCsrf = randToken()
            await prisma.verification.create({
                data: {
                    code: tkCsrf,
                    kind: TOKEN_ONETIME_CSRF
                }
            })
        })
        // redirect to the email verification page
        redirect(`/auth/verify?email=${email}&expired=true&csrf=${tkCsrf}`)
    }

    // token matched and still valid 
    const accountId = await prisma.$transaction(async tx => {
        // delete the token
        await tx.verification.delete({
            where: { id: tkEmailVerify.id }
        })
        // find 'wait_verification' account
        const account = await tx.account.findUnique({
            where: { email: email }
        })
        if (!account) {
            throw new Error(`SYSTEM ERROR: account with email '${email}' does not exist, but it is included in a verification callback`)
        }
        // set account to 'verified'
        if (account.state === ACCOUNT_STATE_WAIT_VERIFICATION) {
            await tx.account.update({
                where: { id: account.id },
                data: {
                    state: ACCOUNT_STATE_VERIFIED
                }
            })
        }
        return account.id
    })
    // now the user has successfully logged in, create a session for this user and redirect to the home page 
    await newSession(accountId)
    redirect('/')
}

async function handleSignout() {
    const session = await getSession()
    if (!session) {
        redirect('/')
    }
    await deleteSession(session)
    redirect('/')
}

async function handleGoogleCallback(request: NextRequest) {
    console.log('get Google OAuth callback: ', request.url)
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
    const profile = await peopleAPI.people.get({
        auth: oauth2Client,
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,photos',
    })
    console.log('Profile: ', profile)

    return NextResponse.json('okay')

    // const prisma = getPrismaClient()
    // const dbState = await prisma.verification.findUnique({
    //     where: {
    //         code: state
    //     }
    // })
    // if (!dbState) {
    //     logger.error(`state not found in db, Possible CSRF attack: ${state}`)
    //     redirect('/error')
    // }
    // if (dbState.code !== state) {
    //     logger.error(`state mismatch, Possible CSRF attack. passed: ${state}, saved: ${dbState.code}`)
    //     redirect('/error')
    // }
}