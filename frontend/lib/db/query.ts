import { account, session, verification } from "@prisma/client";
import { randToken } from "../util";
import { prismaClient, PrismaDBConnection } from "./data-source";
import { Address, EMAIL_AS_IDENTITY, Profile, Tag, TOKEN_ONETIME_CSRF, TOKEN_SESSION_CSRF, TOKEN_VERIFY_EMAIL, VERIFIED, WAIT_VERIFICATION } from "./entities";

export async function findAccountByEmail(email: string, prisma?: PrismaDBConnection): Promise<account | null> {
    if (!prisma) {
        prisma = prismaClient
    }
    return await prisma.account.findUnique({
        where: {
            identity_value_identity_type: {
                identity_type: EMAIL_AS_IDENTITY,
                identity_value: email,
            }
        }
    })
}

export async function createAccountByEmail(email: string, password: string | null, verified: boolean, prisma?: PrismaDBConnection): Promise<any> {
    if (!prisma) {
        prisma = prismaClient
    }
    const state = verified ? VERIFIED : WAIT_VERIFICATION
    if (password) {
        return await prisma.$queryRaw`insert into account (identity_type, identity_value, password, state) values ('email', ${email}, crypt(${password}, gen_salt('bf')), ${state}) returning id`
    } else {
        return await prisma.$queryRaw`insert into account (identity_type, identity_value, state) values ('email', ${email}, ${state}) returning id`
    }
}

export async function createEmailVerificationToken(email: string, prisma?: PrismaDBConnection): Promise<string> {
    if (!prisma) {
        prisma = prismaClient
    }
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

export async function createOnetimeCsrfToken(prisma?: PrismaDBConnection): Promise<string> {
    if (!prisma) {
        prisma = prismaClient
    }
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

export async function getEmailVerificationToken(email: string, token: string): Promise<verification | null> {
    return await prismaClient.verification.findUnique({
        where: {
            email: email,
            code: token,
            type: TOKEN_VERIFY_EMAIL,
        },
    })

}

export async function deleteTokenById(id: number, prisma?: PrismaDBConnection) {
    if (!prisma) {
        prisma = prismaClient
    }
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

export async function findSessionCsrf(session_id: number): Promise<string | null> {
    const verify = await prismaClient.verification.findFirst({
        where: {
            session_id: session_id,
            type: TOKEN_SESSION_CSRF
        },
        orderBy: { created_at: 'desc' }
    })
    if (verify) {
        return verify.code
    }
    return null
}

export async function getProfileByAccountId(account_id: number, prisma?: PrismaDBConnection): Promise<Profile | null> {
    if (!prisma) {
        prisma = prismaClient
    }
    const db_profile = await prisma.profile.findFirst({
        where: {
            account_id: account_id,
        },
        orderBy: { created_at: 'desc' }
    })
    if (!db_profile) {
        return null
    }

    const profile: Profile = {
        id: db_profile.id,
        firstName: db_profile.first_name,
        lastName: db_profile.last_name,
        middleName: db_profile.middle_name,
        photo: db_profile.photo,
        updatedAt: db_profile.updated_at,
        createdAt: db_profile.created_at
    }
    if (db_profile.address_id) {
        const db_addr = await prisma.address.findUnique({
            where: {
                id: db_profile.address_id
            }
        })
        if (db_addr) {
            const addr: Address = {
                id: db_addr.id,
                countryCode: db_addr.country_code,
                region: db_addr.region,
                city: db_addr.city,
                postcode: db_addr.postcode,
                streetAddress: db_addr.street_address,
                extendedAddress: db_addr.extended_address
            }
            profile.address = addr
        }
    }
    return profile
}

export async function getAllTags(): Promise<Tag[]> {
    const db_tags = await prismaClient.tag.findMany()
    return db_tags.map(e => ({
        id: e.id,
        word: e.word,
        createdAt: e.created_at
    }))
}