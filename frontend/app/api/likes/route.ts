import { prismaClient } from "@/lib/db/data-source";
import { getNumberOfLikes } from "@/lib/db/query";
import { StatusCodes } from "http-status-codes";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const paramVideoId = req.nextUrl.searchParams.get('videoId')
    if (!paramVideoId) {
        return new Response(JSON.stringify({ error: 'missing param "videoId"' }), { status: StatusCodes.BAD_REQUEST })
    }
    const videoId = parseInt(paramVideoId)
    const count = await getNumberOfLikes(videoId)
    if (count == 0) {
        return Response.json({ hasLiked: false, likes: 0 })
    }

    const paramAccountId = req.nextUrl.searchParams.get('accountId')
    if (!paramAccountId) {
        return Response.json({ hasLiked: false, likes: count })
    }
    const accountId = parseInt(paramAccountId)
    if (accountId < 0) {
        return Response.json({ hasLiked: false, likes: count })
    }
    const hasLiked = await prismaClient.likes.findUnique({
        where: {
            account_id_video_id: { account_id: parseInt(paramAccountId), video_id: videoId }
        }
    })
    if (hasLiked) {
        return Response.json({ hasLiked: true, likes: count })
    }
    return Response.json({ hasLiked: false, likes: count })
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    const paramAccountId = body['accountId']
    const paramVideoId = body['videoId']
    const reqType = body['reqType']
    if (!paramAccountId || !paramVideoId || !reqType) {
        return new Response(JSON.stringify({ error: 'missing parameters' }), { status: StatusCodes.BAD_REQUEST })
    }

    const accountId = parseInt(paramAccountId)
    const videoId = parseInt(paramVideoId)
    if (reqType === 'add') {
        await prismaClient.$transaction(async tx => {
            const hasLike = await tx.likes.findUnique({
                where: {
                    account_id_video_id: { account_id: accountId, video_id: videoId }
                }
            })
            if (hasLike) {
                return
            }
            await tx.likes.create({
                data: {
                    account_id: accountId,
                    video_id: videoId
                }
            })
        })
    } else if (reqType === 'remove') {
        await prismaClient.$transaction(async tx => {
            const hasLike = await tx.likes.findUnique({
                where: {
                    account_id_video_id: { account_id: accountId, video_id: videoId }
                }
            })
            if (!hasLike) {
                return
            }
            await tx.likes.delete({
                where: {
                    account_id_video_id: { account_id: accountId, video_id: videoId }
                }
            })
        })
    }

    return new Response()
}

