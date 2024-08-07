import { createCSRF } from "@/lib/db/query";
import { getSession } from "@/lib/session";
import { COOKIE_CSRF } from "@/lib/util";
import { StatusCodes } from "http-status-codes";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session) {
        redirect('/auth/signin')
    }

    const csrfCookie = cookies().get(COOKIE_CSRF)
    if (csrfCookie) {
        return new Response()
    }

    const csrf = await createCSRF(session.token)
    cookies().set(COOKIE_CSRF, csrf, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
    })
    return new Response('', { status: StatusCodes.OK })
}