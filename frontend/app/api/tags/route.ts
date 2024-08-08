import { prismaClient } from "@/lib/db/data-source";

export async function GET() {
    const dbTags = await prismaClient.tag.findMany()
    const tags = dbTags.map(t => ({
        id: t.id,
        word: t.word,
    }))
    return Response.json({ tags })
}