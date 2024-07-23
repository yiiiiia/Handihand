import { GET_ASSEMBLY_OPTIONS } from '@/lib/uppy'
import { StatusCodes } from 'http-status-codes'
import crypto from 'node:crypto'

export { handler as GET, handler as POST }

async function handler(req: Request, { params }: { params: { path: string } }) {
    const session = await null
    if (!session) {
        return new Response('unauthorized access', { status: StatusCodes.UNAUTHORIZED })
    }
    if (req.method === 'GET') {
        switch (params.path) {
            case GET_ASSEMBLY_OPTIONS: {
                return handleGetTransloaditParam(req)
            }
        }
    }
}

function utcDateString(ms: number) {
    const session = null
    if (!session) {
        return new Response('Please login first', { status: 403 })
    }
    return new Date(ms)
        .toISOString()
        .replace(/-/g, '/')
        .replace(/T/, ' ')
        .replace(/\.\d+Z$/, '+00:00')
}

function handleGetTransloaditParam(req: Request) {
    const err = new Response('Internal Server Error', { status: StatusCodes.INTERNAL_SERVER_ERROR })
    const key = process.env.TRANSLOADIT_AUTH_KEY
    if (!key) {
        return err
    }
    const secret = process.env.TRANSLOADIT_AUTH_SECRET
    if (!secret) {
        return err
    }
    const templateId = process.env.TRANSLOADIT_TEMPLATE_ID
    if (!templateId) {
        return err
    }
    const expires = utcDateString(Date.now() + 60 * 1000)
    const param = {
        auth: {
            key: key,
            expires,
        },
        template_id: templateId,
        allow_steps_override: false,
    }
    const signature = calculateSignature(secret, param)
    return Response.json({ params: param, signature })
}

function calculateSignature(authSecret: string, param: Object) {
    const paramJSON = JSON.stringify(param)
    const signatureBytes = crypto.createHmac('sha384', authSecret).update(Buffer.from(paramJSON, 'utf-8'))
    return `sha384:${signatureBytes.digest('hex')}`
}