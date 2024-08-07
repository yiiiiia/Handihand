import { prismaClient } from "@/lib/db/data-source";
import { Profile } from "@/lib/db/entities";
import { findProfilebyUsername, getCsrfInSession } from "@/lib/db/query";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/session";
import { COOKIE_CSRF } from "@/lib/util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { z } from "zod";

const dataSchema = z.object({
    username: z.string().trim().max(50, { message: 'username cannot be longer than 50 characters' }).optional(),
    countryCode: z.string().trim().min(2, { message: 'country_code must be the 2-letter ISO 3166-1 alpha-2 standard' }).max(2, { message: "country_code must be the 2-letter ISO 3166-1 alpha-2 standard" }).optional(),
    region: z.string().trim().max(100, { message: 'region cannot be longer than 100 characters' }).optional(),
    city: z.string().trim().max(50, { message: 'city cannot be longer than 50 characters' }).optional(),
    postcode: z.string().trim().max(50, { message: 'postcode cannot be longer than 50 characters' }).optional(),
    streetAddress: z.string().trim().max(100, { message: 'streetAddress cannot be longer than 100 characters' }).optional(),
    extendedAddress: z.string().trim().max(100, { message: 'extendedAddress cannot be longer than 100 characters' }).optional(),
})

export type ProfileUpdateResult = {
    ok: boolean,
    error?: {
        username?: string[];
        countryCode?: string[];
        region?: string[];
        city?: string[];
        postcode?: string[];
        streetAddress?: string[];
        extendedAddress?: string[];
    }
}

export async function POST(req: NextRequest) {
    const { profile, token } = await validateSessionAndCSRF(req)
    const { data, error } = await validateFormData(req)
    if (error) {
        return error
    }
    const resp = await doUpdate(data, profile)
    if (resp.ok) {
        cookies().delete(COOKIE_CSRF)
        await prismaClient.verification.delete({ where: { id: token.id } })
    }
    return Response.json(resp)
}

async function validateSessionAndCSRF(req: NextRequest) {
    const session = await getSession()
    if (!session?.id || !session.profile?.id) {
        logger.warn(`partial session information, session: ${JSON.stringify(session)}`)
        redirect('/error')
    }
    const profile = await prismaClient.profile.findUnique({ where: { id: session.profile.id } })
    if (!profile) {
        logger.warn(`no profile found in db, id: ${session.profile.id}`)
        redirect('/error')
    }
    const cookieCSRF = cookies().get(COOKIE_CSRF)
    if (!cookieCSRF) {
        redirect('/error')
    }
    const csrfToken = await getCsrfInSession(cookieCSRF.value, session.token)
    if (!csrfToken) {
        logger.warn(`invalid csrf: ${cookieCSRF.value}`)
        cookies().delete(COOKIE_CSRF)
        redirect('/error')
    }
    return {
        profile: session.profile,
        token: csrfToken
    }
}

async function validateFormData(req: NextRequest) {
    const formData = await req.formData()
    const data = Object.fromEntries(formData.entries())
    const parsedData = dataSchema.safeParse(data)
    if (!parsedData.success) {
        logger.warn(parsedData.error.flatten().fieldErrors)
        return {
            error: Response.json({
                ok: false,
                error: parsedData.error.flatten().fieldErrors
            })
        }
    }
    if (parsedData.data.countryCode) {
        const country = await prismaClient.countries.findUnique({
            where: { country_code: parsedData.data.countryCode }
        })
        if (!country) {
            return {
                error: Response.json({
                    ok: false,
                    error: { countryCode: ['unknown country'] }
                })
            }
        }
    }

    return {
        data: parsedData.data
    }
}

async function doUpdate(data: any, profile: Profile) {
    let resp: ProfileUpdateResult = { ok: true }
    await prismaClient.$transaction(async (tx): Promise<void> => {
        if (data.username) {
            const dbProfile = await findProfilebyUsername(data.username, tx)
            if (dbProfile && dbProfile.id !== profile.id) {
                resp = {
                    ok: false,
                    error: { username: ['username already exists'] }
                }
                return
            }
        }
        const updateData: Record<string, any> = {}
        if (data.username) {
            updateData.username = data.username
        }
        if (data.countryCode) {
            updateData.country_code = data.countryCode
        }
        if (data.region) {
            updateData.region = data.region
        }
        if (data.city) {
            updateData.city = data.city
        }
        if (data.postcode) {
            updateData.postcode = data.postcode
        }
        if (data.streetAddress) {
            updateData.street_address = data.streetAddress
        }
        if (data.extendedAddress) {
            updateData.extended_address = data.extendedAddress
        }
        await prismaClient.profile.update({
            where: { id: profile.id },
            data: {
                ...updateData,
                updated_at: new Date()
            }
        })
    })
    return resp
}