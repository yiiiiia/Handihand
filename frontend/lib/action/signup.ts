'use server'

import { StatusCodes } from 'http-status-codes'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { ACCOUNT_STATE_WAIT_VERIFICATION, CSRF_ONETIME_TOKEN, getPrismaClient } from '../data-source'
import { logger } from '../logger'
import { sendVerificationEmail } from '../mail'
import { genCsrfToken, genVerificationToken, Token } from '../util'

const emailRegex = /(?:[a-z0-9+!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i

const prisma = getPrismaClient()

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
    let csrfToken: Token = { self: '', encoded: '' }
    try {
        const result = await prisma.$transaction(async tx => {
            // check if acount already exists
            const account = await tx.account.findFirst({ where: { email: email } })
            if (account) {
                return {
                    success: false,
                    error: {
                        email: ['Email alrady exists.'],
                        emailAlreadyExist: true,
                    }
                }
            }
            // create an account
            await tx.$queryRaw`insert into account (email, password, state) values (${email}, crypt(${password}, gen_salt('bf')), ${ACCOUNT_STATE_WAIT_VERIFICATION}) returning id`
            // create the verification token
            const verifyToken = genVerificationToken()
            await tx.verification.create({
                data: {
                    email: email,
                    token: verifyToken.self,
                }
            })
            // create one-time csrf token used to resend email
            csrfToken = genCsrfToken()
            await tx.csrf.create({ data: { token: csrfToken.self, session_id: null, type: CSRF_ONETIME_TOKEN } })
            // send verification email
            await sendVerificationEmail('support@handihand.com', email,
                `${process.env.BASE_URL}/api/auth/callback?email=${email}&token=${verifyToken.encoded}`)
            return { success: true }
        })
        if (!result.success) {
            return result
        }
    } catch (e) {
        logger.error('ERROR: signup failed: ', e)
        return {
            success: false,
            error: { internalError: true }
        }
    }
    redirect(`/auth/verify?email=${email}&csrf=${csrfToken?.encoded}`)
}

type ResendEmailResp = {
    success: boolean,
    errCode?: number,
    errMsg?: string
    csrf?: string,
}

export async function resendEmail(email: string, csrf: string): Promise<ResendEmailResp> {
    if (!email || !csrf) {
        return {
            success: false,
            errCode: StatusCodes.BAD_REQUEST,
            errMsg: 'missing parameters: both "email" and "csrf" are required'
        }
    }
    try {
        // verify csrf token
        const csrfObj = await prisma.csrf.findFirst({ where: { token: csrf, type: CSRF_ONETIME_TOKEN }, orderBy: { created_at: 'desc' } })
        if (!csrfObj) {
            return {
                success: false,
                errCode: StatusCodes.BAD_REQUEST,
            }
        }
        const newCsrf = await prisma.$transaction(async tx => {
            // delete the old csrf token
            await tx.csrf.delete({ where: { id: csrfObj.id } })
            // create a new csrf token
            const newCsrf = genCsrfToken()
            await tx.csrf.create({ data: { token: newCsrf.self, type: CSRF_ONETIME_TOKEN } })
            // create a new email verification token
            const verifyToken = genVerificationToken()
            await tx.verification.create({
                data: {
                    email: email,
                    token: verifyToken.self
                }
            })
            await sendVerificationEmail('support@handihand.com', email, `${process.env.BASE_URL}/api/auth/callback?email=${email}&token=${verifyToken.encoded}`)
            return newCsrf
        })
        return {
            success: true,
            csrf: newCsrf.self
        }
    } catch (err) {
        logger.error(`FAIL: handling resending emali: ${err}`)
        return {
            success: false,
            errCode: StatusCodes.INTERNAL_SERVER_ERROR
        }
    }
}