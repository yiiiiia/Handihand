'use client'

import { Video } from "@/lib/db/entities";
import { selectSearchParams, useGetCommentsQuery, useGetLikesQuery, useGetSavesQuery, useGetVideosQuery, usePostCommentMutation, usePostLikeMutation, usePostSaveMutation } from "@/lib/features/searcher/searcher";
import { useAppSelector } from "@/lib/hooks";
import Image from 'next/image';
import { Dispatch, SetStateAction, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BsFillChatDotsFill } from "react-icons/bs";
import { FaRegStar, FaStar } from "react-icons/fa";
import { FaCircleCheck, FaRegCirclePlay } from "react-icons/fa6";
import { IoIosSend, IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { SessionContext } from "../SessionProvider";

export default function Cards() {
    const searchParams = useAppSelector(selectSearchParams)
    const {
        data,
        isLoading,
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

    const eh = {
        onVideoDisplay: (id: number) => {
            if (videoMap[id]) {
                setSelectedVideo(videoMap[id])
            }
        },
    }

    if (isLoading) {
        return (
            <div className='flex space-x-2 justify-center items-center bg-white h-screen dark:invert'>
                <span className='sr-only'>Loading...</span>
                <div className='h-4 w-4 bg-black rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                <div className='h-4 w-4 bg-black rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                <div className='h-4 w-4 bg-black rounded-full animate-bounce'></div>
            </div>
        )
    }

    return (
        <>
            <div className="grid grid-cols-4 gap-y-8 3xl:grid-cols-5 place-items-center">
                {
                    sortedVideos.map(video => {
                        return (
                            <div key={video.id} className="p-4 rounded-lg flex flex-col gap-y-2 w-[360px]">
                                <div className="relative hover:cursor-pointer" onClick={() => { eh.onVideoDisplay(video.id) }}>
                                    <Image src={video.thumbnailURL} height={1200} width={1200} alt="video-thumbnail" className="rounded-2xl" />
                                    <FaRegCirclePlay size={40} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <div className="flex flex-row gap-x-2">
                                    <Image src={video.profile.photo ?? '/owl.jpg'} width={900} height={900} alt="avatar" className="rounded-full w-10 h-10" />
                                    <div className="flex flex-col">
                                        <p className="text-base font-semibold overflow-hide h-16">{video.description}</p>
                                        <p className="text-sm">{video.profile.username}<FaCircleCheck size={13} className="inline ml-2" /></p>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
            {
                selectedVideo &&
                <PlayVideo video={selectedVideo} setSelectedVideo={setSelectedVideo} />
            }
        </>
    )
}

function PlayVideo({ video, setSelectedVideo }: { video: Video, setSelectedVideo: Dispatch<SetStateAction<Video | null>> }) {
    const session = useContext(SessionContext)
    const accountId = session?.account?.id ?? -1

    const { data: getLikesData } = useGetLikesQuery({ accountId: accountId, videoId: video.id })
    const [postLike] = usePostLikeMutation()
    const { data: getSavesData } = useGetSavesQuery({ accountId: accountId, videoId: video.id })
    const [postSave] = usePostSaveMutation()
    const [postComment, { isLoading: isPostCommentLoading }] = usePostCommentMutation()
    const { data: getCommentsData = [] } = useGetCommentsQuery(video.id)

    const [animation, setAnimation] = useState('animate-fadeIn')
    const [commentFocused, setCommentFocused] = useState(false)
    const [commentContent, setCommentContent] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const smallTextAreaRef = useRef<HTMLTextAreaElement>(null)
    const videoDivRef = useRef<HTMLDivElement>(null)
    const textAreaDivRef = useRef<HTMLDivElement>(null)

    const eh = {
        handleLikeClicked: async () => {
            if (getLikesData?.hasLiked) {
                await postLike({ videoId: video.id, accountId: accountId, reqType: 'remove' }).unwrap()
            } else if (accountId > 0) {
                await postLike({ videoId: video.id, accountId: accountId, reqType: 'add' }).unwrap()
            }
        },

        handleSaveClicked: async () => {
            if (getSavesData?.hasSaved) {
                await postSave({ videoId: video.id, accountId: accountId, reqType: 'remove' }).unwrap()
            } else if (accountId > 0) {
                await postSave({ videoId: video.id, accountId: accountId, reqType: 'add' }).unwrap()
            }
        },

        handleCommentFocused: () => {
            setCommentFocused(true)
        },

        handleCommentOnChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const val = e.target.value.trim()
            if (val) {
                setCommentContent(val)
            }
        },

        handlePostComment: async () => {
            if (isPostCommentLoading) {
                return
            }
            if (!accountId || accountId < 0) {
                return
            }
            const comment = commentContent.trim()
            if (comment.length === 0) {
                return
            }
            await postComment({
                accountId: accountId,
                videoId: video.id,
                comment: comment,
            }).unwrap()

            if (textareaRef.current) {
                textareaRef.current.value = ''
                console.log('comment content:', commentContent)
            }
            if (smallTextAreaRef.current) {
                smallTextAreaRef.current.value = ''
            }
            setCommentContent('')
            setCommentFocused(false)
        }
    }

    useEffect(() => {
        const handleClickDocument = (e: MouseEvent) => {
            if (videoDivRef.current && e.target) {
                if (!videoDivRef.current.contains(e.target as HTMLElement)) {
                    setAnimation('animate-fadeOut')
                    setTimeout(() => {
                        setSelectedVideo(null)
                    }, 500)
                }
            }
            if (textAreaDivRef.current && e.target) {
                if (!textAreaDivRef.current.contains(e.target as HTMLElement)) {
                    setCommentFocused(false)
                }
            }
        }
        document.addEventListener('click', handleClickDocument, true)
        return () => {
            document.removeEventListener('click', handleClickDocument, true);
        };
    }, [setSelectedVideo])


    return (
        <div className={"fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-80 " + animation}>
            <div ref={videoDivRef} className="relative flex flex-row gap-x-4 bg-stone-200 p-10 rounded-lg h-5/6">
                <video controls className="rounded-md bg-white w-[1000px] 3xl:w-[1600px]">
                    <source src={video.uploadURL} />
                </video>
                <div className="flex flex-col rounded-xl w-[300px] 3xl:w-[400px]">
                    <div className="flex flex-col gap-y-2">
                        <div className="flex flex-row gap-x-2 justify-between items-center">
                            <p><Image src={video.profile.photo ?? '/owl.jpg'} width={50} height={10} alt="avatar" className="rounded-full inline" /> {video.profile.username}</p>
                            <button className="px-3 py-2 bg-red-500 rounded-lg text-white">Follow</button>
                        </div>
                        <hr className="border-gray-400" />
                    </div>
                    <div className="py-2 grow overflow-y-auto space-y-4">
                        {
                            getCommentsData.map(e => {
                                return (
                                    <div key={e.commentId} className="flex flex-row gap-x-2">
                                        <Image src={e.photo === '' ? '/owl.jpg' : e.photo} width={30} height={30} alt='avatar' className="inline h-1/2" />
                                        <div className="flex flex-col gap-y-1">
                                            <p className="text-sm">
                                                <span className="font-semibold">{e.username}</span>
                                                <span className="font-light ml-2">{formatDate(e.createdAt)}</span>
                                            </p>
                                            <p>{e.comment}</p>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                    <div className="flex flex-col justify-end mt-2">
                        {
                            commentFocused &&
                            <div ref={textAreaDivRef} className="relative" >
                                <textarea ref={textareaRef} autoFocus disabled={isPostCommentLoading} rows={10} cols={10} placeholder="Comment..."
                                    className="py-2 pl-2 pr-5 rounded-lg overflow-hidden w-full absolute bottom-0 z-10" defaultValue={commentContent} onChange={eh.handleCommentOnChange} />
                                <div className=""><IoIosSend size={25} className="absolute bottom-0 right-2 transform -translate-y-1/2 hover:cursor-pointer z-20" onClick={eh.handlePostComment} /></div>
                            </div>
                        }
                        {
                            !commentFocused &&
                            <div className="relative">
                                <textarea ref={smallTextAreaRef} rows={1} cols={10} placeholder="Comment..." className="py-2 pl-2 pr-5 rounded-lg overflow-hidden w-full" defaultValue={commentContent} onFocus={eh.handleCommentFocused} />
                                {
                                    commentContent.length === 0 &&
                                    <IoIosSend size={25} className="absolute bottom-0 right-2 transform -translate-y-1/2 text-gray-400" />
                                }
                                {
                                    commentContent.length > 0 &&
                                    <IoIosSend size={25} className="absolute bottom-0 right-2 transform -translate-y-1/2 hover:cursor-pointer" onClick={eh.handlePostComment} />
                                }
                            </div>
                        }
                        <div className="flex flex-row p-2 bg-gray-900 justify-around text-gray-100 rounded-lg">
                            <div className="flex flex-row gap-x-2">
                                {
                                    getLikesData?.hasLiked &&
                                    <IoMdHeart size={20} className="hover:cursor-pointer text-red-500" onClick={eh.handleLikeClicked} />
                                }
                                {
                                    !getLikesData?.hasLiked &&
                                    <IoMdHeartEmpty size={20} className="hover:cursor-pointer" onClick={eh.handleLikeClicked} />
                                }
                                <span>{getLikesData?.likes}</span>
                            </div>
                            <div className="flex flex-row gap-x-2">
                                {
                                    getSavesData?.hasSaved &&
                                    <FaStar size={20} className="hover:cursor-pointer text-yellow-300" onClick={eh.handleSaveClicked} />
                                }
                                {
                                    !getSavesData?.hasSaved &&
                                    <FaRegStar size={20} className="hover:cursor-pointer" onClick={eh.handleSaveClicked} />
                                }
                                <span>{getSavesData?.saves}</span>
                            </div>
                            <div className="flex flex-row gap-x-2">
                                <BsFillChatDotsFill size={20} className="hover:cursor-pointer" />
                                <span>{getCommentsData.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function formatDate(createdAt: string) {
    const createdDate = new Date(createdAt)
    const now = new Date()
    return timeDifference(createdDate, now)
}

function timeDifference(date1: Date, date2: Date) {
    const diffInMs = Math.abs(date2.getTime() - date1.getTime());
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInSeconds < 60) {
        return `${diffInSeconds} ${diffInSeconds === 1 ? "second" : "seconds"} ago`;
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    } else if (diffInDays < 7) {
        return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
    } else if (diffInWeeks < 5) {
        return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
    } else if (diffInMonths < 12) {
        return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
    } else {
        return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
    }
}