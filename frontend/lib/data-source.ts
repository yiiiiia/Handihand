import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

export function getPrismaClient() {
    return prisma
}

export const ACCOUNT_STATE_WAIT_VERIFICATION = "wait_verification"
export const ACCOUNT_STATE_VERIFIED = "verified"
export const TOKEN_VERIFY_EMAIL = 0
export const TOKEN_ONETIME_CSRF = 1
export const TOKEN_SESSION_CSRF = 2
export const TOKEN_OAUTH_STATE = 3