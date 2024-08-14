/**
 * This file provides the endpoint used to search videos
 */

import { prismaClient } from "@/lib/db/data-source";
import { Profile, Video } from "@/lib/db/entities";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/session";
import axios, { AxiosResponse } from "axios";
import { StatusCodes } from "http-status-codes";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { path: string } }) {
    if (params.path === 'all') {
        return handleCommonSearchVideos(req)
    }
    if (params.path === 'my-videos') {
        return handleGetMyUploadedVideos()
    }
    return new Response('', { status: StatusCodes.NOT_FOUND })
}

async function handleCommonSearchVideos(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const backendURL = process.env.BACKEND_URL
    if (!backendURL) {
        logger.error(`env BACKEND_URL is empty, cannot perform video searching`)
        return Response.error()
    }

    // searching by product is not yet implemented
    if (searchParams.get('searchBy') === 'product') {
        return Response.json({ videos: [] })
    }

    let res: AxiosResponse<Object[]>
    try {
        res = await axios.get(`${backendURL}/api/videos`, { params: searchParams })
        if (res.status != StatusCodes.OK) {
            logger.error(`response from backend is not 200, but ${res.status}`)
            return new Response('internal error', { status: StatusCodes.INTERNAL_SERVER_ERROR })
        }
    } catch (error) {
        logger.error(`failed to call backend to get videos, error: ${error}`)
        return new Response('', { status: StatusCodes.INTERNAL_SERVER_ERROR })
    }

    const videos: Video[] = []
    res.data.forEach((e: any) => {
        if (!e.profile) {
            logger.warn(`no profile returned for video: ${e.id}`)
        } else {
            const profile: Profile = {
                id: e.profile.id,
                countryCode: e.profile.countryCode,
                region: e.profile.region,
                city: e.profile.city,
                postcode: e.profile.postcode,
                streetAddress: e.profile.streetAddress,
                extendedAddress: e.profile.extendedAddress,
                username: e.profile.username,
                photo: e.profile.photo
            }
            const video: Video = {
                id: e.id,
                title: e.title,
                description: e.description,
                profile: profile,
                createdAt: new Date(e.createdAt),
                countryCode: e.countryCode,
                uploadURL: e.uploadUrl,
                thumbnailURL: e.thumbnailUrl,
                accountId: e.accountId,
            }
            videos.push(video)
        }
    })

    return Response.json({ videos })
}

async function handleGetMyUploadedVideos() {
    const session = await getSession()
    if (!session) {
        return new Response('', { status: StatusCodes.UNAUTHORIZED })
    }
    if (!session.account?.id) {
        logger.error(`no account associated with session: ${session.id}: ${session.token}`)
        return Response.error()
    }
    const accountId = session.account.id
    const videos = await prismaClient.video.findMany({
        where: {
            account_id: accountId
        }
    })
    return Response.json({ number: videos.length })
}