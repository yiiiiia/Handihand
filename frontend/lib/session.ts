import { cookies } from "next/headers";
import { prismaClient } from "./db/data-source";
import { AccountIdentityType, AccountState, Nullable, Session } from "./db/entities";
import { findAccountById, findSession, getProfileByAccountId } from "./db/query";
import { logger } from "./logger";
import { COOKIE_SESSION, randToken } from './util';

const duration = 7 * 24 * 60 * 60 * 1000

export async function newSession(account_id: number) {
    const token = randToken()
    const expire = new Date(Date.now() + duration)
    await prismaClient.session.create({
        data: {
            session: token,
            account_id: account_id,
            expire_at: expire,
        }
    })
    cookies().set(COOKIE_SESSION, token, {
        path: "/",
        httpOnly: true,
        expires: expire,
        sameSite: 'lax',
    })
}

export async function getSession(): Promise<Nullable<Session>> {
    const sessionCookie = cookies().get(COOKIE_SESSION)
    if (!sessionCookie) {
        return null;
    }
    const dbSession = await findSession(sessionCookie.value)
    if (!dbSession) {
        return null
    }
    if (Date.now() > dbSession.expire_at.getTime()) {
        return null
    }

    const account = await findAccountById(dbSession.account_id)
    if (!account) {
        logger.error(`SYSTEM ERROR: account with id ${dbSession.account_id} was recorded in session ${dbSession.id}, but not found in db`)
        return null
    }
    const profile = await getProfileByAccountId(account.id)
    return {
        id: dbSession.id,
        token: dbSession.session,
        account: {
            id: account.id,
            identityType: <AccountIdentityType>account.identity_type,
            identityValue: account.identity_value,
            state: <AccountState>account.state,
            createdAt: account.created_at
        },
        profile: profile,
        expireAt: dbSession.created_at,
        createdAt: dbSession.created_at,
    }
}

export async function extendSession(): Promise<void> {
    const sessionCookie = cookies().get(COOKIE_SESSION)
    if (!sessionCookie) {
        return
    }

    const session = await prismaClient.session.findUnique({ where: { session: sessionCookie.value } })
    if (!session) {
        return
    }
    if (Date.now() < session.expire_at.getTime()) {
        const expire = new Date(Date.now() + duration)
        await prismaClient.session.update({
            where: {
                id: session.id
            },
            data: {
                expire_at: expire,
            }
        })
        cookies().set(COOKIE_SESSION, sessionCookie.value, {
            path: "/",
            httpOnly: true,
            expires: expire,
            sameSite: 'lax',
        })
    }
}

export function deleteSession(token: string) {
    if (token) {
        prismaClient.$transaction(async tx => {
            const dbSession = await tx.session.findUnique({ where: { session: token } })
            if (dbSession) {
                tx.session.delete({ where: { id: dbSession.id } })
            }
        })
    }
    cookies().delete(COOKIE_SESSION)
}