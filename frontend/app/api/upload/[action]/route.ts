import { prismaClient } from "@/lib/db/data-source";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/session";
import { getFileExtension, randToken } from "@/lib/util";
import { Storage } from "@google-cloud/storage";
import { StatusCodes } from 'http-status-codes';
import { notFound, redirect } from "next/navigation";
import { NextRequest } from "next/server";
import path from "path";
import stream from 'stream';

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

const globalUploadingResult: Record<string, boolean> = {}

async function handler(req: NextRequest, { params }: { params: { action: string } }) {
    if (req.method === 'POST' && params.action === 'image') {
        return handleImageUpload(req)
    }

    if (req.method === 'POST' && params.action === 'video') {
        // const checkToken = randToken()
        // setTimeout(() => {
        //     globalUploadingResult[checkToken] = true
        // }, 2000)
        // return Response.json({ checkToken })
        return handleVideoUpload(req)
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

async function handleVideoUpload(req: NextRequest) {
    const session = await getSession()
    if (!session?.account?.id) {
        logger.error(`missing account db id in session: ${session}`)
        redirect('/error')
    }
    if (!session.profile) {
        logger.error(`missing profile in session: ${session}`)
        redirect('/error')
    }

    const accountId = session.account.id
    const countryCode = session.profile.countryCode ?? ''
    const bucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME
    if (!bucketName) {
        logger.error('env "GOOGLE_STORAGE_BUCKET_NAME" is missing')
        redirect('/error')
    }

    const formData = await req.formData()
    const { badRequest, video, image, title, description, videoFileExtension, imageFileExtension } = videoUploadValidation(formData)
    if (badRequest) {
        return badRequest
    }

    const tags: string[] = []
    formData.getAll('tags').forEach(item => {
        tags.push(item as string)
    })

    const checkToken = randToken()
    const asyncUpload = async () => {
        const { videoDest, imageDest } = await uploadVedioImage(video, videoFileExtension, image, imageFileExtension)
        await updateDatabase(accountId, countryCode, title, description, bucketName, video, videoDest, imageDest, tags)
        globalUploadingResult[checkToken] = true
    }
    asyncUpload()

    return Response.json({ checkToken })
}

function videoUploadValidation(formData: FormData) {
    const badStatus = StatusCodes.BAD_REQUEST
    if (!formData) {
        return { badRequest: new Response('no form data', { status: badStatus }) }
    }

    const fieldImage = formData.get('image')
    if (!fieldImage || (typeof fieldImage) !== 'object') {
        return { badRequest: new Response('no image', { status: badStatus }) }
    }
    const image = fieldImage as File
    if (!image.type.startsWith("image/")) {
        return { badRequest: new Response('no image', { status: badStatus }) }
    }
    const imageFileExtension = getFileExtension(image.type)
    if (!imageFileExtension) {
        return { badRequest: new Response(`unsupported image type ${image.type}`, { status: badStatus }) }
    }

    const fieldVideo = formData.get('video')
    if (!fieldVideo || (typeof fieldVideo) !== 'object') {
        return { badRequest: new Response('no video', { status: badStatus }) }
    }
    const video = formData.get('video') as File
    if (!video.type.startsWith("video/")) {
        return { badRequest: new Response('no video', { status: badStatus }) }
    }
    const videoFileExtension = getFileExtension(video.type)
    if (!videoFileExtension) {
        return { badRequest: new Response(`unsupported video type ${video.type}`, { status: badStatus }) }
    }

    const description = formData.get('description') as string
    if (!description || !description.trim()) {
        return { badRequest: new Response('description is required', { status: badStatus }) }
    }

    const title = formData.get('title') as string
    if (!title || !title.trim()) {
        return { badRequest: new Response('title is required', { status: badStatus }) }
    }

    return { video, image, title, description, videoFileExtension, imageFileExtension }
}

async function uploadVedioImage(video: File, videoExt: string, image: File, imageExt: string) {
    const bucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME
    if (!bucketName) {
        throw new Error('env "GOOGLE_STORAGE_BUCKET_NAME" is missing')
    }
    const bucket = googleStorage.bucket(bucketName)
    const videoDestFileName = getDestFileLocation(videoFolder, video.name, videoExt)
    let coverImageName = ''
    if (video.name.lastIndexOf('.') === -1) {
        coverImageName = video.name + "-coverimage"
    } else {
        coverImageName = video.name.substring(0, video.name.lastIndexOf('.')) + '-coveriamge'
    }
    const imageDestFileName = getDestFileLocation(imageFolder, coverImageName, imageExt)

    const videoArrayBuf = await video.arrayBuffer()
    const videoBuffer = Buffer.from(videoArrayBuf)
    const passThroughVideoStream = new stream.PassThrough()
    passThroughVideoStream.write(videoBuffer)
    passThroughVideoStream.end()

    const imageArrayBuf = await image.arrayBuffer()
    const imageBuffer = Buffer.from(imageArrayBuf)
    const passThroughImageStream = new stream.PassThrough()
    passThroughImageStream.write(imageBuffer)
    passThroughImageStream.end()

    await new Promise<void>(resolve => {
        passThroughVideoStream.pipe(bucket.file(videoDestFileName).createWriteStream())
            .on('finish', () => {
                logger.info(`successfully uploaded vedio to: ${videoDestFileName}`)
                resolve()
            })
    })
    await new Promise<void>(resolve => {
        passThroughImageStream.pipe(bucket.file(imageDestFileName).createWriteStream())
            .on('finish', () => {
                logger.info(`successfully uploaded image to: ${imageDestFileName}`)
                resolve()
            })
    })
    return { videoDest: videoDestFileName, imageDest: imageDestFileName }
}

async function updateDatabase(accountId: number, countryCode: string, title: string, description: string, bucketName: string, video: File, videoDestFileName: string, imageDestFileName: string, tags: string[]) {
    const dbVideo = await prismaClient.video.create({
        data: {
            account_id: accountId,
            country_code: countryCode,
            title: title,
            description: description,
            name: video.name,
            type: video.type,
            size: video.size,
            upload_url: getBucketObjectPublicURL(bucketName, videoDestFileName),
            thumbnail_url: getBucketObjectPublicURL(bucketName, imageDestFileName),
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
    const raw = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    return encodeURI(raw)
}
