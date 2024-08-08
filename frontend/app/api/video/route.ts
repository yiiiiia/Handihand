import { Video } from "@/lib/db/entities";
import { logger } from "@/lib/logger";
import axios from "axios";
import { StatusCodes } from "http-status-codes";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const searchBy = searchParams.get('searchBy')
    const countryCode = searchParams.get('countryCode')
    const keyword = searchParams.get('keyword')
    const page = searchParams.get('page')
    const size = searchParams.get('size')

    if (searchBy === 'product') {
        // searching by product is not supported yet
        return Response.json([])
    }

    const backendURL = process.env.BACKEND_URL
    if (!backendURL) {
        logger.error(`env BACKEND_URL is empty, cannot perform video searching`)
        return Response.error()
    }

    const res = await axios.get(`${backendURL}/api/videos`, {
        params: {
            countryCode,
            keyword,
            page,
            size,
            tags: ['t1', 't2', 't3'].join(',')
        }
    })
    if (res.status != StatusCodes.OK) {
        return new Response('internal error', { status: StatusCodes.INTERNAL_SERVER_ERROR })
    }

    console.log('backend response data:', res.data)

    return Response.json(res.data)
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
        }

    }
    for (let i = 0; i < 20; i++) {
        const item = { ...sample, id: i, uploadURL: encodeURI(sample.uploadURL), thumbnailURL: encodeURI(sample.thumbnailURL) }
        result.push(item)
    }
    return Response.json(result)
}