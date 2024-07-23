import { cookies } from "next/headers";
import { getPrismaClient } from "./data-source";
import { genRandomToken } from "./util";
import { logger } from "./logger";

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
    const token = genRandomToken(32)
    const expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.session.create({
        data: {
            account_id: accountId,
            token: token,
            expire_at: expire,
        }
    })
    cookies().set('sessionid', token, {
        path: "/",
        httpOnly: true,
        maxAge: expire.getTime(),
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
            if (Date.now() >= session.created_at.getTime()) {
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
                where: { account_id: session.account_id }
            })
            return {
                accountId: account.id,
                email: account.email,
                expireAt: session.expire_at,
                csrf: session.csrf,
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