import { cookies } from "next/headers";
import { CSRF_SESSION_TOKEN, getPrismaClient } from "./data-source";
import { logger } from "./logger";
import { genSessionToken } from "./util";

const prisma = getPrismaClient()

export type Session = {
    accountId: number,
    email: string,
    expireAt: Date,
    csrf?: string | null,
    avatar?: string | null,
    firstName?: string | null,
    lastName?: string | null,
    country?: string | null,
    address?: string | null
} | null

export async function createNewSession(accountId: number) {
    const token = genSessionToken()
    const expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.session.create({
        data: {
            account_id: accountId,
            token: token.self,
            expire_at: expire,
        }
    })
    cookies().set('sessionid', token.self, {
        path: "/",
        httpOnly: true,
        expires: expire,
    })
}

export async function getSession(): Promise<Session> {
    const sessionId = cookies().get('sessionid')
    if (sessionId) {
        const session = await prisma.session.findFirst({
            where: { token: sessionId.value },
            orderBy: {
                created_at: 'desc',
            }
        })
        if (session) {
            if (Date.now() >= session.expire_at.getTime()) {
                // session has expired, delete it
                await prisma.session.delete({
                    where: { id: session.id }
                })
                cookies().delete('sessionid')
                return null
            }
            const account = await prisma.account.findFirst({
                where: { id: session.account_id }
            })
            if (!account) {
                logger.error(`SYSTEM ERROR: account with id ${session.account_id} was recorded in session ${session.id}, but not found in db`)
                return null
            }
            const profile = await prisma.profile.findFirst({
                where: { account_id: session.account_id },
                orderBy: { created_at: 'desc' }
            })
            const csrf = await prisma.csrf.findFirst({
                where: { session_id: session.id, type: CSRF_SESSION_TOKEN },
                orderBy: { created_at: 'desc' }
            })
            // refresh session expire time
            const expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            await prisma.session.update({
                where: { id: session.id },
                data: {
                    expire_at: expire,
                }
            })
            cookies().set('sessionid', sessionId.value, {
                path: "/",
                httpOnly: true,
                expires: expire,
            })
            return {
                accountId: account.id,
                email: account.email,
                expireAt: session.expire_at,
                csrf: csrf?.token,
                avatar: profile?.avatar,
                firstName: profile?.first_name,
                lastName: profile?.last_name,
                country: profile?.country_code,
                address: profile?.address
            }
        }
    }
    return null
}