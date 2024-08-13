import { prismaClient } from "@/lib/db/data-source";
import { NextRequest } from "next/server";

export const dynamic = 'auto'

export async function GET(req: NextRequest) {
    if (!req.nextUrl.searchParams.get('all')) {
        return Response.json([])
    }

    const dbTags = await prismaClient.tag.findMany()
    const tags = dbTags.map(t => ({
        id: t.id,
        word: t.word,
    }))
    return Response.json(tags)
}