import { StatusCodes } from 'http-status-codes'
import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from './app/middleware/authentication'

export async function middleware(req: NextRequest) {
    const res = authenticate(req)
    if (res.status === StatusCodes.TEMPORARY_REDIRECT) {
        return res
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/api/:path*', '/account/:path*', '/auth/:path*'],
}