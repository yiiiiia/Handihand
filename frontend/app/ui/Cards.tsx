'use client'

import { Video } from "@/lib/db/entities";
import { selectSearchParams, useGetVideosQuery } from "@/lib/features/searcher/searcher";
import { useAppSelector } from "@/lib/hooks";
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from "react";
import { BsFillChatDotsFill } from "react-icons/bs";
import { CiStar } from "react-icons/ci";
import { FaRegCirclePlay } from "react-icons/fa6";
import { IoMdHeartEmpty } from "react-icons/io";

export default function Cards() {
    const searchParams = useAppSelector(selectSearchParams)
    const {
        data,
        // isLoading,
        // isSuccess,
        // isError,
        // error
    } = useGetVideosQuery(searchParams)

    const sortedVideos = useMemo(() => {
        let sortedVideos: Video[] = []
        if (data?.videos) {
            sortedVideos = data.videos.slice()
            sortedVideos.sort((a, b) => {
                const d1 = new Date(b.createdAt)
                const d2 = new Date(b.createdAt)
                return d1.getMilliseconds() - d2.getMilliseconds()
            })
        }
        return sortedVideos
    }, [data?.videos])

    const videoMap: Record<number, Video> = {}
    sortedVideos.forEach(video => {
        videoMap[video.id] = video
    })

    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
    const videoAreaRef = useRef<HTMLDivElement>(null)
    const [videoAreaAnimation, setVideoAreaAnimation] = useState('animate-fadeIn')

    const eh = {
        onVideoDisplay: (id: number) => {
            if (videoMap[id]) {
                setVideoAreaAnimation('animate-fadeIn')
                setSelectedVideo(videoMap[id])
            }
        }
    }

    useEffect(() => {
        const handleClickDocument = (e: MouseEvent) => {
            if (videoAreaRef.current && e.target) {
                if (!videoAreaRef.current.contains(e.target as HTMLElement)) {
                    setVideoAreaAnimation('animate-fadeOut')
                    setTimeout(() => {
                        setSelectedVideo(null)
                    }, 500)
                }
            }
        }
        document.addEventListener('click', handleClickDocument, true)
        return () => {
            document.removeEventListener('click', handleClickDocument, true);
        };
    }, [])

    return (
        <>
            <div className="grid grid-cols-4 gap-y-8 3xl:grid-cols-5 place-items-center">
                {
                    sortedVideos.map(video => {
                        return (
                            <div key={video.id} className="p-4 rounded-lg flex flex-col gap-y-2">
                                <div className="relative hover:cursor-pointer" onClick={() => { eh.onVideoDisplay(video.id) }}>
                                    <Image src={video.thumbnailURL} height={100} width={300} alt="video-thumbnail" className="rounded-2xl w-full" />
                                    <FaRegCirclePlay size={40} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <p className="text-sm h-10 overflow-auto">{video.description}</p>
                                <div className="flex flex-row gap-x-2">
                                    <Image src={video.profile.photo ?? '/owl.jpg'} width={30} height={50} alt="avatar" className="rounded-full" />
                                    <p>{video.profile.username}</p>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
            {
                selectedVideo &&
                <div className={"fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-80 animate-fadeIn " + videoAreaAnimation}>
                    <div ref={videoAreaRef} className="relative flex flex-row gap-x-4 bg-stone-200 p-16 rounded-lg">
                        <video controls className="rounded-md min-w-[500px] 2xl:w-[900px]">
                            <source src={selectedVideo.uploadURL} />
                        </video>
                        <div className="flex flex-col rounded-xl">
                            <div className="flex flex-col gap-y-2">
                                <div className="flex flex-row gap-x-2 items-center">
                                    <Image src={selectedVideo.profile.photo ?? '/owl.jpg'} width={50} height={10} alt="avatar" className="rounded-full" />
                                    <p>{selectedVideo.profile.username}</p>
                                    <button className="ml-5 px-3 py-2 bg-red-500 rounded-lg text-white">Follow</button>
                                </div>
                                <hr className="border-gray-400" />
                            </div>
                            <div className="grow flex flex-col justify-end gap-y-2">
                                <input className="p-2 border-2 rounded-xl bg-stone-50" placeholder="Comment..."></input>
                                <div className="flex flex-row p-2 bg-gray-900 justify-around text-gray-100 rounded-lg">
                                    <div className="flex flex-row gap-x-2">
                                        <IoMdHeartEmpty size={20} className="hover:cursor-pointer" />
                                        <span>0</span>
                                    </div>
                                    <div className="flex flex-row gap-x-2">
                                        <CiStar size={20} className="hover:cursor-pointer" />
                                        <span>0</span>
                                    </div>
                                    <div className="flex flex-row gap-x-2">
                                        <BsFillChatDotsFill size={20} className="hover:cursor-pointer" />
                                        <span>0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </>
    )
}