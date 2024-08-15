import { COOKIE_SESSION } from '@/lib/util'
import { NextRequest, NextResponse } from 'next/server'

const sensitivePath = /^\/account\/\w+|^\/api\/upload$|^\/api\/csrf$/

const noExtraLoginPath = /^\/auth\/(signin|signup|verify)$/

export function authenticate(req: NextRequest) {
    const { pathname } = req.nextUrl
    const session = req.cookies.get(COOKIE_SESSION)
    if (!session && sensitivePath.test(pathname)) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    if (session && noExtraLoginPath.test(pathname)) {
        return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
}