'use server'

import { googleOAuthClient } from "@/app/api/auth/[...action]/oauth"
import { account } from "@prisma/client"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from 'zod'
import { prismaClient } from "../db/data-source"
import { getSession, newSession } from "../session"
import { COOKIE_OAUTH_GOOGLE_STATE, COOKIE_SESSION, randToken } from "../util"
import { VERIFIED } from "../db/entities"

export type SigninState = {
    ok: boolean,
    error: {
        email?: string | undefined;
        password?: string | undefined;
        policy?: string | undefined;
    }
}

const signinSchema = z.object({
    email: z.string({ required_error: "Email is required" }).trim().min(1, { message: "Email must not be empty" }),
    password: z.string({ required_error: "Password is required" }).trim().min(1, { message: "Password must not be empty" }),
    policy: z.string({ required_error: "Agreement is required" }).refine(val => val === 'on', { message: 'Agreement to terms of services is mandatory' })
})

export async function signinByEmail(_: SigninState | null, formData: FormData): Promise<SigninState> {
    const value = {
        email: formData.get('email') ?? undefined,
        password: formData.get('password') ?? undefined,
        policy: formData.get('policy') ?? undefined
    }
    const parsedValue = signinSchema.safeParse(value)
    if (!parsedValue.success) {
        const err = parsedValue.error.format()
        return {
            ok: false,
            error: {
                email: err.email?._errors?.[0],
                password: err.password?._errors?.[0],
                policy: err.policy?._errors?.[0]
            }
        }
    }

    const accounts: account[] = await prismaClient.$queryRaw`select * from account where identity_type ='email' and identity_value = ${parsedValue.data.email} and crypt(${parsedValue.data.password}, password) = password;`
    if (accounts.length == 0) {
        return { ok: false, error: { password: "email doesn't exist or incorrect password" } }
    }
    if (accounts[0].state !== VERIFIED) {
        return { ok: false, error: { email: "email is not verified" } }
    }
    await newSession(accounts[0].id)
    redirect('/')
}


// See: https://developers.google.com/identity/protocols/oauth2/web-server#redirecting
export async function googleOAuthSignin() {
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
    cookies().set(COOKIE_OAUTH_GOOGLE_STATE, state, {
        path: '/api/auth',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 5 * 60,
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

export async function PurgeInvalidSession(): Promise<boolean> {
    const session = await getSession()
    if (!session) {
        const sessionCookie = cookies().get(COOKIE_SESSION)
        if (sessionCookie) {
            cookies().delete(COOKIE_SESSION)
            return true
        }
    }
    return false
}