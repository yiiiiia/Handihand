import { prismaClient } from "@/lib/db/data-source";
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

const imageFolder = 'image'

const videoFolder = 'video'

export type ImageUploadResult = {
    imageURL: string
}

export type SignedURLResult = {
    video: {
        signedURL: string;
        mimeType: string;
        dest: string;
    },
    image: {
        signedURL: string,
        mimeType: string;
        dest: string;
    }
}

const globalUploadingResult: Record<string, boolean> = {}

async function handler(req: NextRequest, { params }: { params: { action: string } }) {
    if (req.method === 'POST' && params.action === 'image') {
        return handleImageUpload(req)
    }

    if (req.method === 'POST' && params.action === 'video') {
        return genVideoUploadSignedURL(req)
    }

    if (req.method === 'POST' && params.action === 'updates') {
        if (req.nextUrl.searchParams.get('type') === 'video') {
            return handleVideoUpdates(req)
        }
        if (req.nextUrl.searchParams.get('type') === 'image') {
            return handleImageUpdates(req)
        }
    }

    if (req.method === 'GET' && params.action === 'check_status') {
        const searchParams = req.nextUrl.searchParams
        const token = searchParams.get('token')
        if (!token) {
            return new Response('', { status: StatusCodes.BAD_REQUEST })
        }
        if (globalUploadingResult[token]) {
            delete globalUploadingResult[token]
            return Response.json({ status: 'ok' })
        }
        return Response.json({ status: 'processing' })
    }

    notFound()
}

async function genVideoUploadSignedURL(req: NextRequest) {
    const session = await getSession()
    if (!session) {
        redirect('/error')
    }

    const bucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME
    if (!bucketName) {
        logger.error('env "GOOGLE_STORAGE_BUCKET_NAME" is missing')
        redirect('/error')
    }

    const formData = await req.formData()
    if (!formData) {
        return new Response('no form data', { status: StatusCodes.BAD_REQUEST })
    }

    const videoName = formData.get('videoName') as string
    if (!videoName) {
        return new Response('missing videoName', { status: StatusCodes.BAD_REQUEST })
    }
    const videoType = formData.get('videoType') as string
    if (!videoType) {
        return new Response('missing videoType', { status: StatusCodes.BAD_REQUEST })
    }
    if (!videoType.startsWith("video/")) {
        return new Response('wrong videoType', { status: StatusCodes.BAD_REQUEST })
    }
    const videoExt = getFileExtension(videoType)
    if (!videoExt) {
        return new Response(`unsupported video type ${videoType}`, { status: StatusCodes.BAD_REQUEST })
    }

    const imageType = formData.get('imageType') as string
    if (!imageType) {
        return new Response('missing imageType', { status: StatusCodes.BAD_REQUEST })
    }
    if (!imageType.startsWith("image/")) {
        return new Response('wrong imageType', { status: StatusCodes.BAD_REQUEST })
    }
    const imageExt = getFileExtension(imageType)
    if (!imageExt) {
        return new Response(`unsupported image type ${imageType}`, { status: StatusCodes.BAD_REQUEST })
    }

    const expiresInSeconds = 60 * 60
    const bucket = googleStorage.bucket(bucketName)
    const videoDest = getDestFileLocation(videoFolder, videoName, videoExt)

    let thumbnailName = ''
    if (videoName.lastIndexOf('.') === -1) {
        thumbnailName = videoName + "-thumbnail"
    } else {
        thumbnailName = videoName.substring(0, videoName.lastIndexOf('.')) + '-thumbnail'
    }
    const imageDest = getDestFileLocation(imageFolder, thumbnailName, imageExt)

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
    const result: SignedURLResult = {
        video: {
            signedURL: videoSignedURL,
            mimeType: videoType,
            dest: videoDest,
        },
        image: {
            signedURL: imageSignedURL,
            mimeType: imageType,
            dest: imageDest
        }
    }
    return Response.json(result)
}

async function handleVideoUpdates(req: NextRequest) {
    const session = await getSession()
    if (!session?.account?.id) {
        logger.error(`missing account db id in session: ${session}`)
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
    const formData = await req.formData()
    const title = formData.get('title') as string
    if (!title || !title.trim()) {
        return new Response('title is required', { status: StatusCodes.BAD_REQUEST })
    }
    const description = formData.get('description') as string
    if (!description || !description.trim()) {
        return new Response('description is required', { status: StatusCodes.BAD_REQUEST })
    }
    const name = formData.get('name') as string
    if (!name || !name.trim()) {
        return new Response('name is required', { status: StatusCodes.BAD_REQUEST })
    }
    const type = formData.get('type') as string
    if (!type || !type.trim()) {
        return new Response('type is required', { status: StatusCodes.BAD_REQUEST })
    }
    const size = formData.get('size') as string
    if (!size || !size.trim()) {
        return new Response('size is required', { status: StatusCodes.BAD_REQUEST })
    }
    const videoDest = formData.get('videoDest') as string
    if (!videoDest || !videoDest.trim()) {
        return new Response('videoDest is required', { status: StatusCodes.BAD_REQUEST })
    }
    const imageDest = formData.get('imageDest') as string
    if (!imageDest || !imageDest.trim()) {
        return new Response('imageDest is required', { status: StatusCodes.BAD_REQUEST })
    }

    const tags: string[] = []
    formData.getAll('tags').forEach(item => {
        tags.push(item as string)
    })

    const sizeInt = parseInt(size)
    const dbVideo = await prismaClient.video.create({
        data: {
            account_id: accountId,
            country_code: countryCode,
            title: title,
            description: description,
            name: name,
            type: type,
            size: sizeInt,
            upload_url: getObjectURL(bucketName, videoDest),
            thumbnail_url: getObjectURL(bucketName, imageDest),
            updated_at: new Date()
        }
    })
    tags.forEach(async e => {
        const word = e as string
        const dbTag = await prismaClient.tag.findUnique({ where: { word: word } })
        if (dbTag) {
            await prismaClient.video_tag.create({
                data: {
                    video_id: dbVideo.id,
                    tag_id: dbTag.id
                }
            })
        } else {
            logger.warn('got unknown tag: ${word}')
        }
    })

    return new Response()
}

async function handleImageUpload(req: Request) {
    const session = await getSession()
    if (!session) {
        redirect('/error')
    }

    const bucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME
    if (!bucketName) {
        throw new Error('env "GOOGLE_STORAGE_BUCKET_NAME" is missing')
    }

    const formData = await req.formData()
    const imageName = formData.get('imageName') as string
    if (!imageName) {
        return new Response('missing imageName', { status: StatusCodes.BAD_REQUEST })
    }
    const imageType = formData.get('imageType') as string
    if (!imageType) {
        return new Response('missing imageType', { status: StatusCodes.BAD_REQUEST })
    }
    if (!imageType.startsWith('image/')) {
        return new Response('wrong image type', { status: StatusCodes.BAD_REQUEST })
    }
    const imageExt = getFileExtension(imageType)
    if (!imageExt) {
        logger.error(`failed to get image file extension for type: ${imageType}`)
        return new Response('unsupported image type', { status: StatusCodes.BAD_REQUEST })
    }

    const expiresInSeconds = 60 * 60
    const bucket = googleStorage.bucket(bucketName)
    const imageDest = getDestFileLocation(imageFolder, imageName, imageExt)
    const [imageSignedURL] = await bucket.file(imageDest).getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + expiresInSeconds * 1000,
        contentType: imageType,
    })

    return Response.json({
        signedURL: imageSignedURL,
        dest: imageDest
    })
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
    const formData = await req.formData()
    const imageDest = formData.get('imageDest') as string
    if (!imageDest || !imageDest.trim()) {
        return new Response('imageDest is required', { status: StatusCodes.BAD_REQUEST })
    }

    const photoURL = getObjectURL(bucketName, imageDest)
    await prismaClient.profile.update({
        where: { id: profileId },
        data: {
            photo: photoURL,
            updated_at: new Date()
        }
    })
    return new Response()
}

function getDestFileLocation(folderPath: string, filename: string, extension: string): string {
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
