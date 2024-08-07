'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAccountByEmail, createEmailToken, createProfile, findAccountByEmail, findProfilebyUsername } from '../db/query'
import { sendEmail } from '../mail'
import { emailRegex } from '../util'

type SignupState = {
    ok: boolean;
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

    const accountId = idObjectArray[0].id
    await createProfile(username, accountId)
    const emailToken = await createEmailToken(email)
    await sendEmail('support@handihand.com', email, `${process.env.BASE_URL}/api/auth/callback?email=${email}&token=${emailToken}`)
    redirect(`/auth/verify?email=${email}`)
}

export async function resendEmail(email: string): Promise<void> {
    if (!email) {
        redirect('/error')
    }
    const emailToken = await createEmailToken(email)
    await sendEmail('support@handihand.com', email, `${process.env.BASE_URL}/api/auth/callback?email=${email}&token=${emailToken}`)
}