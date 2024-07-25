'use server'

import { StatusCodes } from 'http-status-codes'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { ACCOUNT_STATE_WAIT_VERIFICATION, TOKEN_ONETIME_CSRF, getPrismaClient, TOKEN_VERIFY_EMAIL } from '../data-source'
import { logger } from '../logger'
import { sendVerificationEmail } from '../mail'
import { emailRegex, randToken } from '../util'

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
    let tkCsrf = ''
    try {
        await prisma.$transaction(async tx => {
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
            const tkEmailVerify = randToken()
            tkCsrf = randToken()
            // create account in state 'wait_verification'
            await tx.$queryRaw`insert into account (email, password, state) values (${email}, crypt(${password}, gen_salt('bf')), ${ACCOUNT_STATE_WAIT_VERIFICATION}) returning id`
            await tx.verification.create({
                data: {
                    email: email,
                    code: tkEmailVerify,
                    kind: TOKEN_VERIFY_EMAIL,
                }
            })
            // create one-time csrf token used to resend email
            await tx.verification.create({
                data: {
                    code: tkCsrf,
                    kind: TOKEN_ONETIME_CSRF
                }
            })
            // send verification email
            await sendVerificationEmail('support@handihand.com', email, `${process.env.BASE_URL}/api/auth/callback?email=${email}&token=${tkEmailVerify}`)
        })
    } catch (e) {
        logger.error('failed to process sign up by email: ', e)
        return {
            success: false,
            error: { internalError: true }
        }
    }
    redirect(`/auth/verify?email=${email}&csrf=${tkCsrf}`)
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
        // verify the one-time csrf token used to send email
        const token = await prisma.verification.findFirst({
            where: { code: csrf, kind: TOKEN_ONETIME_CSRF },
            orderBy: { created_at: 'desc' }
        })
        if (!token) {
            return {
                success: false,
                errCode: StatusCodes.BAD_REQUEST,
            }
        }
        const newCsrf = await prisma.$transaction(async tx => {
            // delete the old csrf token
            await tx.verification.delete({ where: { id: token.id } })
            // create a new csrf token
            const tkCsrf = randToken()
            await tx.verification.create({
                data: {
                    code: tkCsrf,
                    kind: TOKEN_ONETIME_CSRF
                }
            })
            // create a new email verification token
            const tkEmailVerify = randToken()
            await tx.verification.create({
                data: {
                    email: email,
                    code: tkEmailVerify,
                    kind: TOKEN_VERIFY_EMAIL,
                }
            })
            await sendVerificationEmail('support@handihand.com', email, `${process.env.BASE_URL}/api/auth/callback?email=${email}&token=${tkEmailVerify}`)
            return tkCsrf
        })
        return {
            success: true,
            csrf: newCsrf
        }
    } catch (err) {
        logger.error(`failed to process resend email request: ${err}`)
        return {
            success: false,
            errCode: StatusCodes.INTERNAL_SERVER_ERROR
        }
    }
}