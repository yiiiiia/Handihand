'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prismaClient } from '../db/data-source'
import { createAccountByEmail, createEmailVerificationToken, createOnetimeCsrfToken, createProfileByUsername, findAccountByEmail, findProfilebyUsername, verifyOnetimeCsrfToken } from '../db/query'
import { logger } from '../logger'
import { sendVerificationEmail } from '../mail'
import { emailRegex } from '../util'

type SignupState = {
    ok: boolean;
    csrfToken?: string;
    error?: {
        username?: string[];
        email?: string[];
        password?: string[];
        confirmPassword?: string[];
        policy?: string[];
        emailAlreadyExist?: boolean;
        usernameTaken?: boolean;
    }
}

const signupSchema = z.object({
    username: z
        .string({ required_error: "Username is required" })
        .trim()
        .min(1, { message: "Username must not be empty" })
        .max(40, { message: "Username can not be longer than 40 characters" }),
    email: z
        .string({ required_error: "Email is required" })
        .trim()
        .min(1, { message: "Email must not be empty" })
        .max(40, { message: 'Email can not be longer than 40 characters' })
        .refine(val => val.match(emailRegex), { message: 'Email must be valid' }),
    password: z
        .string({ required_error: "Password is required" })
        .trim()
        .min(8, { message: "Password must be at least 8 characters" })
        .max(36, { message: "Password cannot be longer than 36 characters" }),
    confirmPassword: z
        .string({ required_error: "Password must be confirmed" }).trim(),
    policy: z
        .string({ required_error: 'Agreement to terms of services is mandatory' })
        .trim()
        .refine(val => val === 'on', { message: 'Agreement to terms of services is mandatory' })
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match", path: ['confirmPassword']
})

export async function signup(_: SignupState | null, formData: FormData): Promise<SignupState> {
    const formValue = Object.fromEntries(formData.entries())
    const parsedValue = signupSchema.safeParse(formValue)
    if (!parsedValue.success) {
        return {
            ok: false,
            error: parsedValue.error.flatten().fieldErrors
        }
    }

    const email = parsedValue.data.email
    const password = parsedValue.data.password
    const username = parsedValue.data.username

    const account = await findAccountByEmail(email)
    if (account) {
        return {
            ok: false,
            error: {
                emailAlreadyExist: true,
            }
        }
    }
    const profile = await findProfilebyUsername(username)
    if (profile) {
        return {
            ok: false,
            error: {
                usernameTaken: true,
            }
        }
    }
    const idObjectArray = await createAccountByEmail(email, password, false)
    if (!idObjectArray || idObjectArray.length === 0) {
        throw new Error('"account_id" not returned')
    }
    if (idObjectArray[0].id <= 0) {
        throw new Error('"account_id" returned is not valid: ' + idObjectArray[0].id)
    }

    await createProfileByUsername(username, idObjectArray[0].id)
    const emailVerificationToken = await createEmailVerificationToken(email)
    await sendVerificationEmail('support@handihand.com', email, `${process.env.BASE_URL}/api/auth/callback?email=${email}&token=${emailVerificationToken}`)
    const csrf = await createOnetimeCsrfToken()
    redirect(`/auth/verify?email=${email}&csrf=${csrf}`)
}

export type ResendEmailResult = {
    ok: boolean;
    csrf: string;
}

export async function resendEmail(email: string, csrf: string): Promise<ResendEmailResult> {
    if (!email || !csrf) {
        redirect('/error')
    }
    try {
        const verifyResult = await verifyOnetimeCsrfToken(csrf)
        if (!verifyResult) {
            redirect('error')
        }
        const newCsrf = await prismaClient.$transaction(async (tx): Promise<string> => {
            const newCsrf = await createOnetimeCsrfToken(tx)
            const emailToken = await createEmailVerificationToken(email, tx)
            await sendVerificationEmail('support@handihand.com', email, `${process.env.BASE_URL}/api/auth/callback?email=${email}&token=${emailToken}`)
            return newCsrf
        })
        return {
            ok: true,
            csrf: newCsrf,
        }
    } catch (error) {
        logger.error(`failed to resend email: ${error}`)
        return {
            ok: false,
            csrf: ''
        }
    }
}