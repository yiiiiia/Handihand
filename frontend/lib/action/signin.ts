'use server'

import { googleOAuthClient } from "@/app/api/auth/[...action]/oauth"
import { account } from "@prisma/client"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prismaClient } from "../db/data-source"
import { deleteSession, getSession, newSession } from "../session"
import { randToken } from "../util"

export async function signin(_preState: any, formData: FormData): Promise<string> {
    let email = (<string>formData.get('email')).trim()
    if (!email) {
        return 'Email is required'
    }
    let password = (<string>formData.get('password')).trim()
    if (!password) {
        return 'Password is required'
    }
    const accounts: account[] = await prismaClient.$queryRaw`select * from account where identity_type ='email' and identity_value = ${email} and crypt(${password}, password) = password;`
    if (accounts.length == 0) {
        return "Account does not exist or password does not match"
    }
    await newSession(accounts[0].id)
    redirect('/')
}


// See: https://developers.google.com/identity/protocols/oauth2/web-server#redirecting
export async function beginGoogleOAuthSignin() {
    const scopes = [
        'openid',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ]
    // const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_OAUTH_CALLBACK)
    const oauth2Client = googleOAuthClient()
    // Generate a secure random state value.
    const state = randToken();
    // keep this state in cookie for later verification
    cookies().set({
        name: 'oauth-google-state',
        value: state,
        path: '/api/auth'
    })
    // Generate a url that asks permissions for the Drive activity scope
    const authorizationUrl = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
        /** Pass in the scopes array defined above.
          * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
        scope: scopes,
        // Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes: true,
        // Include the state parameter to reduce the risk of CSRF attacks.
        state: state
    });
    redirect(authorizationUrl)
}

export async function purgeInvalidSession(): Promise<boolean> {
    const session = await getSession()
    if (!session) {
        const sessionid = cookies().get('sessionid')
        if (sessionid) {
            deleteSession()
            return true
        }
    }
    return false
}