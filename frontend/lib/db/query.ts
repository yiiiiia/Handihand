import { account, profile, session, verification } from "@prisma/client";
import { randToken } from "../util";
import { prismaClient, PrismaDBConnection } from "./data-source";
import { Country, EMAIL_AS_IDENTITY, Profile, Tag, TOKEN_ONETIME_CSRF, TOKEN_VERIFY_EMAIL, VERIFIED, WAIT_VERIFICATION } from "./entities";

export type IdObject = {
    id: number
}

export async function findAccountByEmail(email: string, prisma: PrismaDBConnection = prismaClient): Promise<account | null> {
    return await prisma.account.findUnique({
        where: {
            identity_value_identity_type: {
                identity_type: EMAIL_AS_IDENTITY,
                identity_value: email,
            }
        }
    })
}

export async function findProfilebyUsername(username: string, prisma: PrismaDBConnection = prismaClient): Promise<profile | null> {
    return await prisma.profile.findUnique({
        where: {
            username: username
        }
    })
}

export async function createAccountByEmail(email: string, password: string | null, verified: boolean, prisma: PrismaDBConnection = prismaClient): Promise<IdObject[]> {
    const state = verified ? VERIFIED : WAIT_VERIFICATION
    if (password) {
        return await prisma.$queryRaw`insert into account (identity_type, identity_value, password, state) values ('email', ${email}, crypt(${password}, gen_salt('bf')), ${state}) returning id`
    } else {
        return await prisma.$queryRaw`insert into account (identity_type, identity_value, state) values ('email', ${email}, ${state}) returning id`
    }
}

export async function createProfileByUsername(username: string, accountId: number, prisma: PrismaDBConnection = prismaClient): Promise<profile> {
    return await prisma.profile.create({
        data: {
            account_id: accountId,
            username: username
        }
    })
}

export async function createEmailVerificationToken(email: string, prisma: PrismaDBConnection = prismaClient): Promise<string> {
    const token = randToken()
    await prisma.verification.create({
        data: {
            email: email,
            code: token,
            type: TOKEN_VERIFY_EMAIL,
        }
    })
    return token
}

export async function createOnetimeCsrfToken(prisma: PrismaDBConnection = prismaClient): Promise<string> {
    const token = randToken()
    await prisma.verification.create({
        data: {
            code: token,
            type: TOKEN_ONETIME_CSRF
        }
    })
    return token
}

export async function verifyOnetimeCsrfToken(csrf: string): Promise<boolean> {
    const result: Object[] = await prismaClient.$queryRaw`delete from verification where code = ${csrf} and type=${TOKEN_ONETIME_CSRF} returning id`
    return result.length > 0
}

export async function verifyOnetimeCsrfTokenInSession(csrf: string, sessionId: number): Promise<boolean> {
    const result: Object[] = await prismaClient.$queryRaw`delete from verification where code = ${csrf} and session_id = ${sessionId} and type=${TOKEN_ONETIME_CSRF} returning id`
    return result.length > 0
}

export async function getEmailVerificationToken(email: string, token: string): Promise<verification | null> {
    return await prismaClient.verification.findUnique({
        where: {
            email: email,
            code: token,
            type: TOKEN_VERIFY_EMAIL,
        },
    })

}

export async function deleteTokenById(id: number, prisma: PrismaDBConnection = prismaClient) {
    await prisma.verification.delete({
        where: { id: id }
    })
}

export async function findSessionBySessionId(sessionid: string): Promise<session | null> {
    return await prismaClient.session.findUnique({
        where: {
            session_id: sessionid
        },
    })
}

export async function findAccountById(id: number): Promise<account | null> {
    return await prismaClient.account.findUnique({
        where: {
            id: id
        }
    })
}

export async function getProfileByAccountId(account_id: number, prisma: PrismaDBConnection = prismaClient): Promise<Profile | null> {
    const dbProfile = await prisma.profile.findFirst({
        where: {
            account_id: account_id,
        },
        orderBy: { created_at: 'desc' }
    })
    if (!dbProfile) {
        return null
    }
    return {
        id: dbProfile.id,
        countryCode: dbProfile.country_code,
        region: dbProfile.region,
        city: dbProfile.city,
        postcode: dbProfile.postcode,
        streetAddress: dbProfile.street_address,
        extendedAddress: dbProfile.extended_address,
        username: dbProfile.username,
        photo: dbProfile.photo,
        updatedAt: dbProfile.updated_at,
        createdAt: dbProfile.created_at
    }
}

export async function getTags(): Promise<Tag[]> {
    const db_tags = await prismaClient.tag.findMany()
    return db_tags.map(e => ({
        id: e.id,
        word: e.word,
        createdAt: e.created_at
    }))
}

export async function getCountries(): Promise<Country[]> {
    const dbCountries = await prismaClient.countries.findMany()
    return dbCountries.map(item => ({
        code: item.country_code,
        name: item.country_name
    }))
}