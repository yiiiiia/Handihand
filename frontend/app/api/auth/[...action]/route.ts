import { ACCOUNT_STATE_VERIFIED, ACCOUNT_STATE_WAIT_VERIFICATION, CSRF_ONETIME_TOKEN, getPrismaClient } from "@/lib/data-source"
import { createNewSession } from "@/lib/session"
import { genCsrfToken } from "@/lib/util"
import { notFound, redirect } from "next/navigation"

export { handler as GET, handler as POST }

async function handler(req: Request, { params }: { params: { action: string[] } }) {
    if (params.action.length == 1 && params.action[0] === 'callback') {
        return handleEmailCallback(req)
    }
}

async function handleEmailCallback(req: Request) {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    const token = searchParams.get('token')
    if (!email || !token) {
        notFound()
    }

    const prisma = getPrismaClient()
    const verifyToken = await prisma.verification.findFirst({
        where: {
            email: email,
            token: token,
        },
        orderBy: {
            created_at: 'desc',
        }
    })
    if (!verifyToken) {
        notFound()
    }

    const now = new Date()
    let diff = Math.abs(now.getTime() - verifyToken.created_at.getTime())
    if (diff > 5 * 60 * 1000) {
        // verification token has expired
        // create a new csrf token
        const csrf = genCsrfToken()
        await prisma.csrf.create({ data: { token: csrf.self, session_id: null, type: CSRF_ONETIME_TOKEN } })
        // redirect to the email verification page
        redirect(`/auth/verify?email=${email}&expired=true&csrf=${csrf.encoded}`)
    }

    // token is matched within time frame
    const accountId = await prisma.$transaction(async tx => {
        const account = await tx.account.findUnique({
            where: { email: email }
        })
        if (!account) {
            throw new Error(`SYSTEM ERROR: account with email '${email}' does not exist, but it is included in a verification callback`)
        }
        // update account to 'verified'
        if (account.state === ACCOUNT_STATE_WAIT_VERIFICATION) {
            await tx.account.update({
                where: { id: account.id },
                data: {
                    state: ACCOUNT_STATE_VERIFIED
                }
            })
        }
        // delete the token
        await tx.verification.delete({
            where: { id: verifyToken.id }
        })
        return account.id
    })

    // now the user has successfully logged in, create a session for this user and redirect to the home page 
    await createNewSession(accountId)
    redirect('/')
}