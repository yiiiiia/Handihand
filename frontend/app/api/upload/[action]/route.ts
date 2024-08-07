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

async function handler(req: NextRequest, { params }: { params: { action: string } }) {
    if (req.method === 'POST' && params.action === 'image') {
        return handleImageUpload(req)
    }
    if (req.method === 'POST' && params.action === 'video') {
        return handleVideoUpload(req)
    }
    notFound()
}

async function handleVideoUpload(req: NextRequest) {
    const session = await getSession()
    if (!session || !session.account || !session.profile) {
        logger.error(`incomplete session info: ${JSON.stringify(session)}`)
        redirect('/error')
    }
    if (!session.account.id) {
        logger.error(`no account db id`)
        redirect('/error')
    }
    const accountId = session.account.id

    const formData = await req.formData()
    if (!formData) {
        return new Response('', { status: StatusCodes.BAD_REQUEST })
    }

    if (!formData.get('cover') || (typeof formData.get('cover')) !== 'object') {
        return new Response('no cover image', { status: StatusCodes.BAD_REQUEST })
    }
    const coverImage = formData.get('cover') as File
    if (!coverImage.type.startsWith("image/")) {
        return new Response('no cover image', { status: StatusCodes.BAD_REQUEST })
    }

    if (!formData.get('video') || (typeof formData.get('video')) !== 'object') {
        return new Response('no video file', { status: StatusCodes.BAD_REQUEST })
    }
    const video = formData.get('video') as File
    if (!video.type.startsWith("video/")) {
        return new Response('no video file', { status: StatusCodes.BAD_REQUEST })
    }

    const description = formData.get('description') as string
    if (!description || !description.trim()) {
        return new Response('description is required', { status: StatusCodes.BAD_REQUEST })
    }
    const title = formData.get('title') as string
    if (!title || !title.trim()) {
        return new Response('title is required', { status: StatusCodes.BAD_REQUEST })
    }

    const bucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME
    if (!bucketName) {
        throw new Error('env "GOOGLE_STORAGE_BUCKET_NAME" is missing')
    }
    const gb = googleStorage.bucket(bucketName)

    // save video
    const videoExt = getFileExtension(video.type)
    if (!videoExt) {
        logger.error(`failed to get video file extension for type: ${video.type}`)
        return new Response('unsupported video file', { status: StatusCodes.BAD_REQUEST })
    }
    const videoDest = getDestFileLocation(videoFolder, video.name, videoExt)
    const videoArrayBuf = await video.arrayBuffer()
    const videoBuf = Buffer.from(videoArrayBuf)
    await gb.file(videoDest).save(videoBuf)

    // save cover iamge
    const imageExt = getFileExtension(coverImage.type)
    if (!imageExt) {
        logger.error(`failed to get image file extension for type: ${coverImage.type}`)
        return new Response('unsupported image file', { status: StatusCodes.BAD_REQUEST })
    }
    let coverImageName = ''
    if (video.name.lastIndexOf('.') === -1) {
        coverImageName = video.name + "-coverimage"
    } else {
        coverImageName = video.name.substring(0, video.name.lastIndexOf('.')) + '-coveriamge'
    }
    const imageDest = getDestFileLocation(imageFolder, coverImageName, imageExt)
    const imageArrayBug = await video.arrayBuffer()
    const imageBuf = Buffer.from(imageArrayBug)
    await gb.file(imageDest).save(imageBuf)

    logger.info(`successfully uploaded vedio and image file to: ${videoDest} and ${imageDest}`)

    const dbVideo = await prismaClient.video.create({
        data: {
            account_id: accountId,
            country_code: session.profile.countryCode,
            title: title,
            description: description,
            name: video.name,
            type: video.type,
            size: video.size,
            upload_url: getBucketObjectPublicURL(bucketName, videoDest),
            thumbnail_url: getBucketObjectPublicURL(bucketName, imageDest),
            updated_at: new Date()
        }
    })

    const tags = formData.getAll('tag')
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

export type ImageUploadResult = {
    imageURL: string
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
    if (!formData.get('image') || (typeof formData.get('image')) !== 'object') {
        return new Response('invalid request: missing files', { status: StatusCodes.BAD_REQUEST })
    }

    const imageFile = formData.get('image') as File
    if (!imageFile.name) {
        return new Response('invalid request: missing file name', { status: StatusCodes.BAD_REQUEST })
    }
    if (!imageFile.type.startsWith('image/')) {
        return new Response('invalid request: cannot process none-image file', { status: StatusCodes.BAD_REQUEST })
    }
    const extension = getFileExtension(imageFile.type)
    if (!extension) {
        logger.error(`failed to get image file extension for type: ${imageFile.type}`)
        return new Response('internal error', { status: StatusCodes.INTERNAL_SERVER_ERROR })
    }

    const destFileLocation = getDestFileLocation(imageFolder, imageFile.name, extension)
    const arrayBuf = await imageFile.arrayBuffer()
    const buf = Buffer.from(arrayBuf)
    await googleStorage.bucket(bucketName).file(destFileLocation).save(buf)

    const profile = session.profile
    if (!profile) {
        logger.error(`system inconsistency: no profile for session: ${session.id}`)
        return new Response('internal error', { status: StatusCodes.INTERNAL_SERVER_ERROR })
    }
    const imageURL = getBucketObjectPublicURL(bucketName, destFileLocation)
    await prismaClient.profile.update({
        where: { id: profile.id ?? -1 },
        data: {
            photo: imageURL,
        }
    })

    return Response.json({ imageURL: imageURL })
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

// Function to get the URL of the object in google cloud bucket
export function getBucketObjectPublicURL(bucketName: string, fileName: string) {
    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}
