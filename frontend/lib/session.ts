import crypto from 'crypto';
import { cookies } from "next/headers";
import { TOKEN_SESSION_CSRF, getPrismaClient } from "./data-source";
import { logger } from "./logger";
import { randToken } from './util';

const prisma = getPrismaClient()
const duration = 7 * 24 * 60 * 60 * 1000
const cookie = 'sessionid'

export type Session = {
    sid: string,
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

export async function newSession(accountId: number) {
    const sessionid = randToken()
    const expire = new Date(Date.now() + duration)
    await prisma.session.create({
        data: {
            account_id: accountId,
            session_id: sessionid,
            expire_at: expire,
        }
    })
    cookies().set({
        name: 'sessionid',
        value: sessionid,
        path: "/",
        httpOnly: true,
        expires: expire,
    })
}

export async function getSession(): Promise<Session> {
    const sessionid = cookies().get('sessionid')
    if (!sessionid) {
        return null;
    }
    const session = await prisma.session.findUnique({
        where: { session_id: sessionid.value },
    })
    if (!session) {
        return null
    }
    if (Date.now() >= session.expire_at.getTime()) {
        // session has expired, delete it
        await prisma.session.delete({
            where: { id: session.id }
        })
        return null
    }

    const account = await prisma.account.findUnique({
        where: { id: session.account_id }
    })
    if (!account) {
        logger.error(`SYSTEM ERROR: account with id ${session.account_id} was recorded in session ${session.id}, but not found in db`)
        return null
    }
    const profile = await prisma.profile.findFirst({
        where: {
            account_id: session.account_id
        },
        orderBy: { created_at: 'desc' }
    })
    // find the long-term csrf related with the session
    const csrf = await prisma.verification.findFirst({
        where: {
            session_id: session.id,
            kind: TOKEN_SESSION_CSRF
        },
        orderBy: { created_at: 'desc' }
    })
    return {
        sid: sessionid.value,
        accountId: account.id,
        email: account.email,
        expireAt: session.expire_at,
        csrf: csrf?.code,
        avatar: profile?.avatar,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        country: profile?.country_code,
        address: profile?.address
    }
}

export async function extendSession(): Promise<void> {
    const sessionid = cookies().get('sessionid')
    if (!sessionid) {
        return
    }
    const session = await prisma.session.findUnique({
        where: { session_id: sessionid.value }
    })
    if (!session) {
        return
    }
    if (Date.now() >= session.expire_at.getTime()) {
        // session expired, delete the old
        await prisma.session.delete({ where: { id: session.id } })
        await newSession(session.account_id)
    } else {
        // session is still valid, extend it's expire time
        const expire = new Date(Date.now() + duration)
        await prisma.session.update({
            where: {
                id: session.id
            },
            data: {
                expire_at: expire,
            }
        })
        cookies().set({
            name: 'sessionid',
            value: sessionid.value,
            path: "/",
            httpOnly: true,
            expires: expire,
        })
    }
}

export async function deleteSession(session: Session) {
    if (!session || !session.sid) {
        return
    }
    await prisma.session.deleteMany({
        where: { session_id: session.sid }
    })
    cookies().delete(cookie)
}