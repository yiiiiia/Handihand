'use server'

import { z } from "zod"
import { prismaClient } from "../db/data-source";
import { findProfilebyUsername, verifyOnetimeCsrfTokenInSession } from "../db/query";
import { getSession } from "../session";
import { redirect } from "next/navigation";
import { logger } from "../logger";

const updateProfileSchema = z.object({
    username: z.string().trim().max(50, { message: 'username cannot be longer than 50 characters' }),
    countryCode: z.string().trim().min(2, { message: 'country_code must be the 2-letter ISO 3166-1 alpha-2 standard' }).max(2, { message: "country_code must be the 2-letter ISO 3166-1 alpha-2 standard" }),
    region: z.string().trim().max(100, { message: 'region cannot be longer than 100 characters' }),
    city: z.string().trim().max(50, { message: 'city cannot be longer than 50 characters' }),
    postcode: z.string().trim().max(50, { message: 'postcode cannot be longer than 50 characters' }),
    streetAddress: z.string().trim().max(100, { message: 'streetAddress cannot be longer than 100 characters' }),
    extendedAddress: z.string().trim().max(100, { message: 'extendedAddress cannot be longer than 100 characters' }),
})

type ProfileUpdateState = {
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

export async function updateProfile(_: ProfileUpdateState, formData: FormData): Promise<ProfileUpdateState> {
    const session = await getSession()
    if (!session?.id || !session.profile?.id) {
        logger.warn(`missing session information, session: ${JSON.stringify(session)}`)
        redirect('/error')
    }

    const profile = await prismaClient.profile.findUnique({ where: { id: session.profile.id } })
    if (!profile) {
        logger.warn(`no profile found in db, id: ${session.profile.id}`)
        redirect('/error')
    }

    const formValue = Object.fromEntries(formData.entries())
    if (!formValue['csrf']) {
        redirect('/error')
    }

    const csrf = formValue['csrf'] as string
    const csrfCheck = await verifyOnetimeCsrfTokenInSession(csrf, session.id)
    if (!csrfCheck) {
        logger.warn(`invalid csrf: ${csrf}`)
        redirect('/error')
    }

    const parsedValue = updateProfileSchema.safeParse(formValue)
    if (!parsedValue.success) {
        return {
            ok: false,
            error: parsedValue.error.flatten().fieldErrors
        }
    }

    if (parsedValue.data.countryCode) {
        const country = await prismaClient.countries.findUnique({
            where: { country_code: parsedValue.data.countryCode }
        })
        if (!country) {
            return {
                ok: false,
                error: { countryCode: ['unknown country'] }
            }
        }
    }

    return await prismaClient.$transaction(async (tx): Promise<ProfileUpdateState> => {
        if (parsedValue.data.username) {
            const profile = await findProfilebyUsername(parsedValue.data.username, tx)
            if (profile) {
                return {
                    ok: false,
                    error: { username: ['username already exists'] }
                }
            }
        }
        const reqData = parsedValue.data
        const updateData: Record<string, any> = {}
        if (reqData.username) {
            updateData.username = reqData.username
        }
        if (reqData.countryCode) {
            updateData.country_code = reqData.countryCode
        }
        if (reqData.region) {
            updateData.region = reqData.region
        }
        if (reqData.city) {
            updateData.city = reqData.city
        }
        if (reqData.postcode) {
            updateData.postcode = reqData.postcode
        }
        if (reqData.streetAddress) {
            updateData.street_address = reqData.streetAddress
        }
        if (reqData.extendedAddress) {
            updateData.extended_address = reqData.extendedAddress
        }
        await prismaClient.profile.update({
            where: { id: profile.id },
            data: {
                ...updateData,
                updated_at: new Date()
            }
        })
        return {
            ok: true
        }
    })
}