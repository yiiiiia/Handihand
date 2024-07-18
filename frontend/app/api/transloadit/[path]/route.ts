import { pathGetAssemblyOptions } from '@/lib/uppy'
import crypto from 'node:crypto'

export { handler as GET, handler as POST }

function utcDateString(ms: number) {
    return new Date(ms)
        .toISOString()
        .replace(/-/g, '/')
        .replace(/T/, ' ')
        .replace(/\.\d+Z$/, '+00:00')
}

function handler(req: Request, { params }: { params: { path: string } }) {
    if (req.method === 'GET') {
        switch (params.path) {
            case pathGetAssemblyOptions: {
                return handleGetTransloaditParam(req)
            }
        }
    }
}

function handleGetTransloaditParam(req: Request) {
    const err = new Response('Internal Server Error', { status: 500 })
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