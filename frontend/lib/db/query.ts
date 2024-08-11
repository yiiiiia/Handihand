import { account, profile, session, verification } from "@prisma/client";
import { randToken } from "../util";
import { prismaClient, PrismaDBConnection } from "./data-source";
import { Country, EMAIL_AS_IDENTITY, Profile, Tag, VERIFIED, WAIT_VERIFICATION } from "./entities";

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

export async function createProfile(username: string, accountId: number, prisma: PrismaDBConnection = prismaClient): Promise<profile> {
    return await prisma.profile.create({
        data: {
            account_id: accountId,
            username: username
        }
    })
}

export async function createEmailToken(email: string, prisma: PrismaDBConnection = prismaClient): Promise<string> {
    const token = randToken()
    await prisma.verification.create({
        data: {
            email: email,
            code: token,
        }
    })
    return token
}

export async function createCSRF(session: string, prisma: PrismaDBConnection = prismaClient): Promise<string> {
    const token = randToken()
    await prisma.verification.create({
        data: {
            code: token,
            session: session,
        }
    })
    return token
}

export async function getEmailToken(email: string, token: string): Promise<verification | null> {
    return await prismaClient.verification.findUnique({
        where: {
            email: email,
            code: token
        }
    })
}

export async function deleteToken(id: number) {
    await prismaClient.verification.delete({ where: { id: id } })
}

export async function checkEmailToken(email: string, token: string): Promise<boolean> {
    const result: Object[] = await prismaClient.$queryRaw`delete from verification where email = ${email} and code = ${token} returning id`
    return result.length > 0
}

export async function checkCsrfToken(csrf: string): Promise<boolean> {
    const result: Object[] = await prismaClient.$queryRaw`delete from verification where code = ${csrf} returning id`
    return result.length > 0
}

export async function getCsrfInSession(csrf: string, session: string): Promise<verification | null> {
    return await prismaClient.verification.findUnique({
        where: {
            code: csrf,
            session: session
        }
    })
}

export async function findSession(token: string): Promise<session | null> {
    return await prismaClient.session.findUnique({ where: { session: token } })
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
    let countryName = ''
    if (dbProfile.country_code) {
        const country = await prisma.countries.findUnique({ where: { country_code: dbProfile.country_code } })
        if (country) {
            countryName = country.country_name
        }
    }
    return {
        id: dbProfile.id,
        countryCode: dbProfile.country_code,
        countryName: countryName,
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

export async function getNumberOfLikes(videoId: number): Promise<number> {
    const result: any[] = await prismaClient.$queryRaw`select count(1) from likes where video_id = ${videoId}`
    if (!result) {
        return 0
    }
    const countN = result[0].count as BigInt
    return parseInt(countN.toString())
}

export async function getNumberOfSaves(videoId: number): Promise<number> {
    const result: any[] = await prismaClient.$queryRaw`select count(1) from saves where video_id = ${videoId}`
    if (!result) {
        return 0
    }
    const countN = result[0].count as BigInt
    return parseInt(countN.toString())
}