'use server'

import { redirect } from "next/navigation"
import { getSession } from "../session"
import { prismaClient } from "../db/data-source"

export type VideoUploadRecord = {
    assembly_id: string,
    template_id: string,
    upload_id: string,
    name: string,
    type: string,
    size: number,
    upload_url: string,
    assembly_url: string,
    meta: {
        title: string,
        description: string,
        tags: string[]
    }
}

type TagMap = {
    [name: string]: number
}

export async function recordUploadedVideo(record: VideoUploadRecord) {
    const session = await getSession()
    if (!session?.account?.id) {
        redirect('/error')
    }

    const video = await prismaClient.video.create({
        data: {
            account_id: session.account.id,
            country_code: session.profile?.address?.countryCode,
            title: record.meta.title,
            description: record.meta.description,
            name: record.name,
            type: record.type,
            size: record.size,
            upload_id: record.upload_id,
            template_id: record.template_id,
            assembly_id: record.assembly_id,
            upload_url: record.upload_url,
        }
    })


    const tagMap: TagMap = {}
    const tags = await prismaClient.tag.findMany()
    tags.forEach(e => {
        tagMap[e.word] = e.id
    })
    record.meta.tags.forEach(async e => {
        const tagId = tagMap[e]
        if (tagId) {
            await prismaClient.video_tag.create({
                data: {
                    video_id: video.id,
                    tag_id: tagId
                }
            })
        }
    })
}