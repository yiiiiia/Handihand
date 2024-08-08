'use client'

import { Video } from "@/lib/db/entities";
import { selectVideos } from "@/lib/features/videos/videoSlice"
import { useAppSelector } from "@/lib/hooks"
import Image from 'next/image'
import { useState } from "react";
import { FaRegCirclePlay } from "react-icons/fa6";
import { IoMdHeartEmpty } from "react-icons/io";
import { PiStarThin } from "react-icons/pi";
import { BsFillChatDotsFill } from "react-icons/bs";
import { CiStar } from "react-icons/ci";

export default function Cards() {
    const videos = useAppSelector(selectVideos)
    const videoMap: Record<number, Video> = {}
    videos.forEach(video => {
        videoMap[video.id] = video
    })

    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

    const eh = {
        onVideoDisplay: (id: number) => {
            const video = videoMap[id]
            console.log('video:', video)
            if (video) {
                setSelectedVideo(video)
            }
        }
    }

    return (
        <>
            <div className="grid grid-cols-4 gap-y-8 3xl:grid-cols-5 place-items-center">
                {
                    videos.map(video => {
                        return (
                            <div key={video.id} className="p-4 rounded-lg flex flex-col gap-y-2">
                                <div className="relative hover:cursor-pointer">
                                    <Image src={video.thumbnailURL} height={100} width={300} alt="video-thumbnail" className="rounded-2xl" onClick={() => { eh.onVideoDisplay(video.id) }} />
                                    <FaRegCirclePlay size={40} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <p className="text-sm mt-2">{video.description}</p>
                                <div className="flex flex-row gap-x-2">
                                    <Image src={video.profile.photo ?? ''} width={30} height={50} alt="avatar" className="rounded-full" />
                                    <p>{video.profile.username}</p>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
            {
                selectedVideo &&
                <PlayVideo video={selectedVideo} />
            }
        </>
    )
}

function PlayVideo({ video }: { video: Video }) {
    return (
        <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-80 py-10">
            <div className="flex flex-row gap-x-4 bg-stone-200 p-8 rounded-lg">
                <video controls width={880} height={0} className="rounded-md" >
                    <source src={video.uploadURL} />
                </video>
                <div className="flex flex-col">
                    <div className="flex flex-col gap-y-2">
                        <div className="flex flex-row gap-x-2 items-center">
                            <Image src={video.profile.photo ?? ''} width={60} height={10} alt="avatar" className="rounded-full" />
                            <p>{video.profile.username}</p>
                            <button className="ml-8 px-4 py-2 bg-red-500 rounded-lg text-white">Follow</button>
                        </div>
                        <hr className="border-gray-400" />
                    </div>
                    <div className="grow flex flex-col justify-end gap-y-2">
                        <input className="p-2 border-2 rounded-xl bg-stone-50" placeholder="Comment..."></input>
                        <div className="flex flex-row p-2 bg-gray-900 justify-around text-gray-100 rounded-lg">
                            <div className="flex flex-row gap-x-2">
                                <IoMdHeartEmpty size={20} className="hover:cursor-pointer" />
                                <span>515</span>
                            </div>
                            <div className="flex flex-row gap-x-2">
                                <CiStar size={20} className="hover:cursor-pointer" />
                                <span>415</span>
                            </div>
                            <div className="flex flex-row gap-x-2">
                                <BsFillChatDotsFill size={20} className="hover:cursor-pointer" />
                                <span>415</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}