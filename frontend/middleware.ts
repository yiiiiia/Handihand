import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

const sessionStrictPaths = ["/account", '/api/upload']

export async function middleware(request: NextRequest) {
    const reqPath = request.nextUrl.pathname
    const sessionid = cookies().get('sessionid')
    if (!sessionid?.value) {
        for (const path in sessionStrictPaths) {
            if (reqPath.startsWith(path)) {
                return NextResponse.redirect(new URL('/not-found', request.url))
            }
        }
    } else if (reqPath.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/', request.url))
    }
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: '/(.*)',
}