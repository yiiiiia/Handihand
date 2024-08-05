import { prismaClient } from "@/lib/db/data-source";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/session";
import { getBucketObjectPublicURL, getFileExtension, randToken } from "@/lib/util";
import { Storage } from "@google-cloud/storage";
import { StatusCodes } from 'http-status-codes';
import { redirect } from "next/navigation";
import path from "path";

export { handler as GET, handler as POST };

const serviceKey = path.join(process.cwd(), 'gs_key.json')

const googleStorage = new Storage({
    keyFilename: serviceKey,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
})

const folder = 'image'

async function handler(req: Request, { params }: { params: { action: string } }) {
    if (req.method === 'POST' && params.action === 'image') {
        return handleImageUpload(req)
    }
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

    const destFileLocation = getDestFileLocation(folder, imageFile.name, extension)
    console.log('dest file location:', destFileLocation)
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
