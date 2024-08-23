import { prismaClient } from "@/lib/db/data-source";
import { PostPhotoMeta, PostVideoMeta } from "@/lib/features/searcher/searcher";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/session";
import { getFileExtension, randToken } from "@/lib/util";
import { Storage } from "@google-cloud/storage";
import { StatusCodes } from 'http-status-codes';
import { notFound, redirect } from "next/navigation";
import { NextRequest } from "next/server";
import path from "path";

export { handler as GET, handler as POST };

const serviceKey = path.join(process.cwd(), 'gs_key.json')

const googleStorage = new Storage({
    keyFilename: serviceKey,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
})

const dirImage = 'image'
const dirVideo = 'video'

export interface PostGetSignedURL {
    videoName: string;
    videoType: string;
    imageName: string;
    imageType: string;
}

export interface SignedURLResp {
    videoSignedURL: string;
    imageSignedURL: string,
    videoDest: string,
    imageDest: string,
}


async function handler(req: NextRequest, { params }: { params: { action: string } }) {
    if (req.method === 'POST' && params.action === 'signedURL') {
        return getSignedUploadURL(req)
    }
    if (req.method === 'POST' && params.action === 'updates') {
        const searchParams = req.nextUrl.searchParams
        if (searchParams.get('type') === 'video') {
            return handleVideoUpdates(req)
        }
        if (searchParams.get('type') === 'photo') {
            return handleImageUpdates(req)
        }
    }
    notFound()
}

async function getSignedUploadURL(req: NextRequest) {
    const session = await getSession()
    if (!session) {
        redirect('/error')
    }

    const bucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME
    if (!bucketName) {
        logger.error('env "GOOGLE_STORAGE_BUCKET_NAME" is missing')
        redirect('/error')
    }

    const expiresInSeconds = 60 * 60
    const bucket = googleStorage.bucket(bucketName)
    const searchParams = req.nextUrl.searchParams
    if (searchParams.get('for') === 'video') {
        const reqData: PostGetSignedURL = await req.json()
        const { videoName, videoType, imageType } = reqData
        if (!videoName || !videoType || !imageType) {
            return new Response(JSON.stringify({ error: "missing request params" }), { status: StatusCodes.BAD_REQUEST })
        }
        if (!videoType.startsWith("video/")) {
            return new Response(JSON.stringify({ error: 'wrong video type' }), { status: StatusCodes.BAD_REQUEST })
        }
        const videoExt = getFileExtension(videoType)
        if (!videoExt) {
            return new Response(JSON.stringify({ error: `unsupported video type ${videoType}` }), { status: StatusCodes.BAD_REQUEST })
        }
        if (!imageType.startsWith("image/")) {
            return new Response(JSON.stringify({ error: 'wrong imageType' }), { status: StatusCodes.BAD_REQUEST })
        }
        const imageExt = getFileExtension(imageType)
        if (!imageExt) {
            return new Response(JSON.stringify({ error: `unsupported image type ${imageType}` }), { status: StatusCodes.BAD_REQUEST })
        }
        const videoDest = getFileDest(dirVideo, videoName, videoExt)

        let imageName = ''
        if (videoName.lastIndexOf('.') === -1) {
            imageName = videoName + "-thumbnail"
        } else {
            imageName = videoName.substring(0, videoName.lastIndexOf('.')) + '-thumbnail'
        }
        const imageDest = getFileDest(dirImage, imageName, imageExt)

        const [videoSignedURL] = await bucket.file(videoDest).getSignedUrl({
            version: "v4",
            action: "write",
            expires: Date.now() + expiresInSeconds * 1000,
            contentType: videoType,
        })
        const [imageSignedURL] = await bucket.file(imageDest).getSignedUrl({
            version: "v4",
            action: "write",
            expires: Date.now() + expiresInSeconds * 1000,
            contentType: imageType,
        })
        return Response.json({
            videoSignedURL: videoSignedURL,
            imageSignedURL: imageSignedURL,
            videoDest: videoDest,
            imageDest: imageDest,
        })
    }
    if (searchParams.get('for') === 'photo') {
        const reqData: PostGetSignedURL = await req.json()
        const imageName = reqData.imageName
        const imageType = reqData.imageType
        if (!imageName || !imageType) {
            return new Response(JSON.stringify({ error: 'missing request parameters' }), { status: StatusCodes.BAD_REQUEST })
        }
        if (!imageType.startsWith('image/')) {
            return new Response(JSON.stringify({ error: 'wrong image type' }), { status: StatusCodes.BAD_REQUEST })
        }
        const imageExt = getFileExtension(imageType)
        if (!imageExt) {
            return new Response(JSON.stringify({ error: `unsupported image type: ${imageType}` }), { status: StatusCodes.BAD_REQUEST })
        }

        const imageDest = getFileDest(dirImage, imageName, imageExt)
        const [imageSignedURL] = await bucket.file(imageDest).getSignedUrl({
            version: "v4",
            action: "write",
            expires: Date.now() + expiresInSeconds * 1000,
            contentType: imageType,
        })
        return Response.json({
            imageSignedURL: imageSignedURL,
            imageDest: imageDest,
        })
    }

    return new Response('', { status: StatusCodes.NOT_FOUND })
}

async function handleVideoUpdates(req: NextRequest) {
    const session = await getSession()
    if (!session?.account?.id) {
        logger.error(`missing account database id in session: ${session}`)
        redirect('/error')
    }
    if (!session.profile) {
        logger.error(`missing profile in session: ${session}`)
        redirect('/error')
    }
    const bucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME
    if (!bucketName) {
        logger.error('env "GOOGLE_STORAGE_BUCKET_NAME" is missing')
        redirect('/error')
    }

    const accountId = session.account.id
    const countryCode = session.profile.countryCode ?? ''
    let meta: PostVideoMeta = await req.json()
    if (!meta.title) {
        return new Response(JSON.stringify({ error: 'title is required' }), { status: StatusCodes.BAD_REQUEST })
    }
    if (!meta.description) {
        return new Response(JSON.stringify({ error: 'description is required' }), { status: StatusCodes.BAD_REQUEST })
    }
    if (!meta.name) {
        return new Response(JSON.stringify({ error: 'video name is required' }), { status: StatusCodes.BAD_REQUEST })
    }
    if (!meta.type) {
        return new Response(JSON.stringify({ error: 'video type is required' }), { status: StatusCodes.BAD_REQUEST })
    }
    if (!meta.size) {
        return new Response(JSON.stringify({ error: 'video size is required' }), { status: StatusCodes.BAD_REQUEST })
    }
    if (!meta.videoDest) {
        return new Response(JSON.stringify({ error: 'videoDest is required' }), { status: StatusCodes.BAD_REQUEST })
    }
    if (!meta.thumbnailDest) {
        return new Response(JSON.stringify({ error: 'thumbnailDest is required' }), { status: StatusCodes.BAD_REQUEST })
    }

    const dbVideo = await prismaClient.video.create({
        data: {
            account_id: accountId,
            country_code: countryCode,
            title: meta.title,
            description: meta.description,
            name: meta.name,
            type: meta.type,
            size: meta.size,
            upload_url: getObjectURL(bucketName, meta.videoDest),
            thumbnail_url: getObjectURL(bucketName, meta.thumbnailDest),
            updated_at: new Date()
        }
    })
    meta.tags.forEach(async word => {
        const dbTag = await prismaClient.tag.findUnique({ where: { word: word } })
        if (dbTag) {
            await prismaClient.video_tag.create({
                data: {
                    video_id: dbVideo.id,
                    tag_id: dbTag.id
                }
            })
        }
    })
    return new Response()
}

async function handleImageUpdates(req: Request) {
    const session = await getSession()
    if (!session) {
        redirect('/error')
    }
    if (!session.profile?.id) {
        logger.error(`missing profile in session: ${session}`)
        redirect('/error')
    }
    const bucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME
    if (!bucketName) {
        logger.error('env "GOOGLE_STORAGE_BUCKET_NAME" is missing')
        redirect('/error')
    }

    const profileId = session.profile.id
    const reqData: PostPhotoMeta = await req.json()
    if (!reqData.photoDest) {
        return new Response('photoDest is required', { status: StatusCodes.BAD_REQUEST })
    }
    const photoURL = getObjectURL(bucketName, reqData.photoDest)
    await prismaClient.profile.update({
        where: { id: profileId },
        data: {
            photo: photoURL,
            updated_at: new Date()
        }
    })
    return new Response()
}

function getFileDest(folderPath: string, filename: string, extension: string): string {
    let name = ''
    if (filename.lastIndexOf('.') === -1) {
        name = filename
    } else {
        name = filename.substring(0, filename.lastIndexOf('.'))
    }
    if (!folderPath) {
        throw new Error('folder path is required')
    }
    if (folderPath.endsWith('/')) {
        folderPath = folderPath.substring(0, folderPath.length - 1)
    }
    return [folderPath, '/', name, '_', randToken(), '.', extension].join('')
}

function getObjectURL(bucketName: string, fileDest: string) {
    const raw = `https://storage.googleapis.com/${bucketName}/${fileDest}`;
    return encodeURI(raw)
}
