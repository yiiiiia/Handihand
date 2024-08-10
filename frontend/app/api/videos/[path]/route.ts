import { prismaClient } from "@/lib/db/data-source";
import { Profile, Video } from "@/lib/db/entities";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/session";
import axios from "axios";
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

    const res = await axios.get(`${backendURL}/api/videos`, { params: searchParams })
    if (res.status != StatusCodes.OK) {
        return new Response('internal error', { status: StatusCodes.INTERNAL_SERVER_ERROR })
    }

    logger.info('get video search result:', res.data)

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
                thumbnailURL: e.thumbnailUrl
            }
            videos.push(video)
        }
    });
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

function sample() {
    const result: Video[] = []
    const sample: Video = {
        id: 0,
        title: 'Hello Video',
        description: "A Brif Description About the Video",
        uploadURL: 'https://storage.googleapis.com/handihandit_bucket/video/Beautiful flower embroider_ab91a9ad9506c7f8f9b381847358da549df24c0af7a5157f8685b3032ac849e9.mp4',
        thumbnailURL: 'https://storage.googleapis.com/handihandit_bucket/image/Beautiful flower embroider-coveriamge_809e2ed00e87230127bf08af506dcd2ee28015ccc8de6d2213889ee17d2cf590.png',
        profile: {
            id: 0,
            photo: 'https://lh3.googleusercontent.com/a/ACg8ocLItYCylDVKrXiu-fpci4vAdmYBB2vESHsr_JMfak5kSbAWWg=s100',
            username: 'qufei@handihand'
        },
        createdAt: new Date()

    }
    for (let i = 0; i < 20; i++) {
        const item = { ...sample, id: i, uploadURL: encodeURI(sample.uploadURL), thumbnailURL: encodeURI(sample.thumbnailURL) }
        result.push(item)
    }
    return Response.json(result)
}