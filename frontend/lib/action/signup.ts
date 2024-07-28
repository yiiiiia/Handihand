'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prismaClient } from '../db/data-source'
import { createEmailVerificationToken, createAccountByEmail, createOnetimeCsrfToken, findAccountByEmail, verifyOnetimeCsrfToken } from '../db/query'
import { logger } from '../logger'
import { sendVerificationEmail } from '../mail'
import { emailRegex } from '../util'

type SignUpResult = {
    success: boolean,
    error?: {
        email?: string[],
        password?: string[],
        passwordRepeat?: string[],
        policyAgree?: string[],
        emailAlreadyExist?: boolean,
        internalError?: boolean
    }
}

const signupSchema = z.object({
    email: z
        .string({ required_error: "Email is required" })
        .trim()
        .min(1, { message: "Email cannot be empty" })
        .max(40, { message: 'Email must be less than 40 characters' })
        .refine(val => val.match(emailRegex), { message: 'Email is not valid' }),
    password: z
        .string({ required_error: "Password is required" })
        .trim()
        .min(8, { message: "Password must be at least 8 characters long" })
        .max(36, { message: "Password must be less than 36 characters" }),
    passwordRepeat: z.string().trim(),
    policyAgree: z.string({ required_error: 'Agreement to policy is required' }).trim()
}).refine(data => data.password === data.passwordRepeat, { message: "Passwords do not match", path: ['passwordRepeat'] })

export async function signup(_preState: any, formData: FormData): Promise<SignUpResult> {
    const form = Object.fromEntries(formData.entries())
    const parsedForm = signupSchema.safeParse(form)
    if (!parsedForm.success) {
        return {
            success: false,
            error: parsedForm.error.flatten().fieldErrors
        }
    }

    const email = parsedForm.data.email
    const password = parsedForm.data.password
    let csrfToken = ''
    try {
        await prismaClient.$transaction(async tx => {
            const account = await findAccountByEmail(email, tx)
            if (account) {
                return {
                    success: false,
                    error: {
                        email: ['Email alrady exists.'],
                        emailAlreadyExist: true,
                    }
                }
            }

            await createAccountByEmail(email, password, false, tx)
            const emailVerificationToken = await createEmailVerificationToken(email, tx)
            await sendVerificationEmail('support@handihand.com', email, `${process.env.BASE_URL}/api/auth/callback?email=${email}&token=${emailVerificationToken}`)
            csrfToken = await createOnetimeCsrfToken(tx)
        })
    } catch (e) {
        logger.error('failed to process sign up by email: ', e)
        return {
            success: false,
            error: { internalError: true }
        }
    }
    redirect(`/auth/verify?email=${email}&csrf=${csrfToken}`)
}

export async function resendEmail(email: string, csrf: string): Promise<string> {
    if (!email || !csrf) {
        redirect('/error')
    }
    // verify the one-time csrf token used to send email
    const verifyResult = await verifyOnetimeCsrfToken(csrf)
    if (!verifyResult) {
        redirect('error')
    }
    await prismaClient.$transaction(async tx => {
        // create a new csrf token
        csrf = await createOnetimeCsrfToken(tx)
        // create a new email verification token
        const email_verify_token = await createEmailVerificationToken(email, tx)
        // send email
        await sendVerificationEmail('support@handihand.com', email, `${process.env.BASE_URL}/api/auth/callback?email=${email}&token=${email_verify_token}`)
    })
    return csrf
}