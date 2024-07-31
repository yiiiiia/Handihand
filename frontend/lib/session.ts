import { cookies } from "next/headers";
import { prismaClient } from "./db/data-source";
import { AccountIdentityType, AccountState, Nullable, Session } from "./db/entities";
import { logger } from "./logger";
import { randToken } from './util';
import { findAccountById, findSessionBySessionId, findSessionCsrf, getProfileByAccountId } from "./db/query";

const duration = 7 * 24 * 60 * 60 * 1000

export async function newSession(account_id: number) {
    const sessionid = randToken()
    const expire = new Date(Date.now() + duration)
    await prismaClient.session.create({
        data: {
            session_id: sessionid,
            account_id: account_id,
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

export async function getSession(): Promise<Nullable<Session>> {
    const sessionid = cookies().get('sessionid')
    if (!sessionid) {
        return null;
    }
    const session = await findSessionBySessionId(sessionid.value)
    if (!session) {
        return null
    }
    if (Date.now() > session.expire_at.getTime()) {
        // expired session
        return null
    }
    const account = await findAccountById(session.account_id)
    if (!account) {
        logger.error(`SYSTEM ERROR: account with id ${session.account_id} was recorded in session ${session.id}, but not found in db`)
        return null
    }
    const profile = await getProfileByAccountId(account.id)
    const csrf = await findSessionCsrf(session.id)
    return {
        id: session.id,
        sessionid: session.session_id,
        account: {
            id: account.id,
            identityType: <AccountIdentityType>account.identity_type,
            identityValue: account.identity_value,
            state: <AccountState>account.state,
            createdAt: account.created_at
        },
        profile: profile,
        expireAt: session.created_at,
        createdAt: session.created_at,
        csrf: csrf
    }
}

export async function extendSession(): Promise<void> {
    const sessionid = cookies().get('sessionid')
    if (!sessionid) {
        return
    }
    const session = await prismaClient.session.findUnique({
        where: { session_id: sessionid.value }
    })
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
        cookies().set({
            name: 'sessionid',
            value: sessionid.value,
            path: "/",
            httpOnly: true,
            expires: expire,
        })
    }
}

export function deleteSession(session?: Session) {
    if (session) {
        prismaClient.session.delete({
            where: { id: session.id }
        }).catch(err => {
            logger.error(`db error: failed to delte session: ${err}`)
        })
    }
    cookies().delete('sessionid')
}