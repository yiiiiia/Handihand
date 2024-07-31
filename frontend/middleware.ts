import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/account')) {
        const sessionid = cookies().get('sessionid')
        if (!sessionid) {
            return NextResponse.redirect(new URL('/error', request.url))
        }
    } else if (request.nextUrl.pathname.startsWith('/auth')) {
        const sessionid = cookies().get('sessionid')
        if (sessionid) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: '/(.*)',
}