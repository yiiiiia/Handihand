import { prismaClient } from "@/lib/db/data-source";
import { CommentInfo, PostComment } from "@/lib/features/searcher/searcher";
import { logger } from "@/lib/logger";
import { StatusCodes } from "http-status-codes";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const paramVideoId = req.nextUrl.searchParams.get('videoId')
    if (!paramVideoId) {
        return new Response(JSON.stringify({ error: 'missing parameters' }), { status: StatusCodes.BAD_REQUEST })
    }
    const videoId = parseInt(paramVideoId)
    const comments = await prismaClient.comments.findMany({
        where: { video_id: videoId }
    })
    if (!comments) {
        return Response.json([])
    }

    let resp: CommentInfo[] = []
    for (let i = 0; i < comments.length; i++) {
        const comment = comments[i]
        const accountId = comment.account_id
        const profile = await prismaClient.profile.findFirstOrThrow({
            where: { account_id: accountId },
            orderBy: { created_at: 'desc' }
        })
        if (profile) {
            let commetInfo: CommentInfo = {
                videoId: videoId,
                accountId: accountId,
                commentId: comment.id,
                photo: profile.photo ?? '',
                username: profile.username ?? '',
                comment: comment.comment,
                createdAt: comment.created_at.toISOString()
            }
            resp.push(commetInfo)
        }
    }
    return Response.json(resp)
}

export async function POST(req: NextRequest) {
    const reqBody = await req.json()
    if (!reqBody['accountId'] || !reqBody['videoId'] || !reqBody['comment']) {
        return new Response(JSON.stringify({ error: 'missing parameters' }), { status: StatusCodes.BAD_REQUEST })
    }
    let postComment: PostComment = reqBody
    await prismaClient.comments.create({
        data: {
            account_id: postComment.accountId,
            video_id: postComment.videoId,
            comment: postComment.comment
        }
    })
    return new Response()
}