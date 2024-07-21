'use server'

import { z } from 'zod'
import { pool } from '../db/data-source'
import { createAccount, getAccountByEmail } from '../db/query'

const loginFormSchema = z.object({
    email: z.string({ required_error: "email is required" })
        .trim()
        .min(1, { message: "email is empty" })
        .max(40, { message: 'email must be less than 40 characters' })
        .refine(val => val.match(emailRegex), { message: 'invalid email' }),
    password: z.string({ required_error: "password is required" })
        .trim()
        .min(8, { message: "password must be at least 8 characters" })
        .max(36, { message: "password must be less than 36 characters" }),
})

// type LoginFormSchema = z.infer<typeof loginFormSchema>
export async function login(_preState: any, formData: FormData) {
    const formObj = Object.fromEntries(formData.entries())
    const result = loginFormSchema.safeParse(formObj)
    if (!result.success) {
        return result.error.flatten().fieldErrors
    }
}

const emailRegex = /(?:[a-z0-9+!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i
const specialChars = /[+!@#$%&'*+/=?^_`{|}~\[\]-]/

function testPasswordStrength(password: string) {
    let numOfSpecialChar = 0
    if (!password) {
        return false
    }
    for (const ch of password) {
        if (ch.match(specialChars)) {
            numOfSpecialChar++
        }
    }
    return numOfSpecialChar >= 2
}

interface SignUpValidationError {
    email?: string[],
    password?: string[],
    passwordRepeat?: string[],
    policyAgree?: string[],
    extra: any
}

const signupSchema = z.object({
    email: z
        .string({ required_error: "email is required" })
        .trim()
        .min(1, { message: "email is empty" })
        .max(40, { message: 'email must be less than 40 characters' })
        .refine(val => val.match(emailRegex), { message: 'email is not valid' }),
    password: z
        .string({ required_error: "password is required" })
        .trim()
        .min(8, { message: "password must be at least 8 characters long with at least 2 special characters (!@#$%^&*()_+[]-)" })
        .max(36, { message: "password must be less than 36 characters" })
        .refine(val => testPasswordStrength(val), { message: 'password must be at least 8 characters long with at least 2 special characters (!@#$%^&*()_+[]-)' }),
    passwordRepeat: z.string().trim(),
    policyAgree: z.string({ required_error: 'agreement to policy is required' }).trim()
}).refine(data => data.password === data.passwordRepeat, { message: "passwords do not match", path: ['passwordRepeat'] })

export async function signup(_preState: any, formData: FormData): Promise<SignUpValidationError | void> {
    const formObj = Object.fromEntries(formData.entries())
    const parsingResult = signupSchema.safeParse(formObj)
    if (!parsingResult.success) {
        return {
            ...parsingResult.error.flatten().fieldErrors,
            extra: {}
        }
    }

    return await getAccountByEmail(pool, parsingResult.data.email).then(account => {
        if (account) {
            console.log('got account:', account)
            return {
                email: ['email alrady exists'],
                extra: {
                    redirectURL: '/auth/login'
                }
            }
        } else {
            console.log('About to create account')
            createAccount(pool, parsingResult.data.email, parsingResult.data.password).then(result => {
                console.log("SUCCESS: create account, result", result)
            }).catch(e => console.log('FAIL: create account: ', e))
        }
    }).catch(e => {
        console.log('FAIL: registration', e)
    })
}