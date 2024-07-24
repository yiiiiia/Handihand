import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

export function getPrismaClient() {
    return prisma
}

export const ACCOUNT_STATE_WAIT_VERIFICATION = "wait_verification"
export const ACCOUNT_STATE_VERIFIED = "verified"
export const CSRF_ONETIME_TOKEN = 1
export const CSRF_SESSION_TOKEN = 0