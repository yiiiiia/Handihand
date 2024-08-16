/**
 * This file provides the video uploading functionality
 */

'use client'

import { Tag } from "@/lib/db/entities";
import { PostVideoMeta, useGetTagsQuery, usePostVideoMetaMutation } from "@/lib/features/searcher/searcher";
import { hideUploader } from "@/lib/features/uploader/uploaderSlice";
import { useAppDispatch } from "@/lib/hooks";
import { dataURLToBlob } from "@/lib/util";
import axios, { AxiosProgressEvent } from 'axios';
import { Fzf } from 'fzf';
import { StatusCodes } from "http-status-codes";
import NextImage from "next/image";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { FaCirclePlus, FaCloudArrowUp } from "react-icons/fa6";
import { IoCheckmarkCircle } from "react-icons/io5";
import { RxCrossCircled } from "react-icons/rx";
import { PostGetSignedURL, SignedURLResp } from "../api/upload/[action]/route";

const thumbnailHeight = 375
const thumbnailWidth = 500

// 0 - choose a video
// 1 - add description to the video
// 2 - upload video
// 3 - check video processing result
// 4 - backend video processing done
type Phase = 0 | 1 | 2 | 3 | 4

export default function VideoUpload() {
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [generatedCoverDataURL, setGeneratedCoverDataURL] = useState('')
    const [selectedCover, setSelectedCover] = useState<File | null>(null)
    const selectedCoverDataURL = useRef('')
    const [duration, setDuration] = useState(0)
    const [phase, setPhase] = useState<Phase>(0)
    const [addingCategory, setAddingCategory] = useState(false)
    const [fuzzyTags, setFuzzyTags] = useState<string[]>([])
    const [selectedTags, setSelectedTags] = useState<Tag[]>([])
    const [chooseCover, setChooseCover] = useState(false)
    const [useGeneratedCover, setUseGeneratedCover] = useState(true)
    const [descError, setDescError] = useState('')
    const [titleError, setTitleError] = useState('')
    const [uploadPercentage, setUploadPercentage] = useState(0)
    const [submiting, setSubmiting] = useState(false)

    const videoFileInputRef = useRef<HTMLInputElement>(null)
    const imageFileInputRef = useRef<HTMLInputElement>(null)
    const categoryInputRef = useRef<HTMLInputElement>(null)
    const categoryInputDivRef = useRef<HTMLDivElement>(null)
    const mainAeraRef = useRef<HTMLDivElement>(null)
    const dispatch = useAppDispatch()
    const [postVideoMeta] = usePostVideoMetaMutation()

    const { data: tags = [] } = useGetTagsQuery()
    const tagMap: Record<string, Tag> = {}
    const tagList: string[] = []
    if (tags) {
        tags.forEach(tag => {
            tagMap[tag.word.toLowerCase()] = tag
            tagList.push(tag.word)
        })
    }

    const convertDuration = (dur: number): string => {
        if (dur <= 0) {
            return '0m 0s'
        }
        dur = Math.floor(dur)
        const secs = dur % 60
        dur = Math.floor(dur / 60)
        const mins = dur % 60
        const hours = Math.floor(dur / 60)
        return `${hours}h ${mins}m ${secs}s`
    }

    const convertSize = (bytes: number): string => {
        bytes = Math.floor(bytes)
        if (bytes < 1024) {
            return `${bytes} B`
        }
        if (bytes < 1024 * 1024) {
            const kb = (bytes / 1024).toFixed(2)
            return `${kb} K`
        }
        if (bytes < Math.pow(1024, 3)) {
            const mb = (bytes / Math.pow(1024, 2)).toFixed(2)
            return `${mb} M`
        }
        const gb = (bytes / Math.pow(1024, 3))
        return `${gb} G`
    }

    const getVideoThumbanil = () => {
        if (useGeneratedCover) {
            return generatedCoverDataURL
        }
        return selectedCoverDataURL.current
    }

    const eh = {
        onSelectBtnClicked: () => {
            if (videoFileInputRef.current) {
                videoFileInputRef.current.click()
            }
        },

        onCategoryInputKeydown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault()
                let tag: Tag | null = null
                if (fuzzyTags.length > 0) {
                    const word = fuzzyTags[0]
                    tag = tagMap[word.toLowerCase()]
                }
                setAddingCategory(false)
                setFuzzyTags([])
                if (tag) {
                    setSelectedTags(tags => [...tags, tag])
                }
            }
        },

        onFileDropped: async (e: React.DragEvent) => {
            e.preventDefault()
            const files = e.dataTransfer.files
            let video: File | null = null
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    if (files[i].type.startsWith("video/")) {
                        video = files[i]
                    }
                }
            }
            if (video) {
                const { dataURL, duration } = await extractThumbnail(video)
                setVideoFile(video)
                setGeneratedCoverDataURL(dataURL)
                setDuration(duration)
                setPhase(1)
            }
        },

        onVideoFileSelected: async (e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                const video = e.target.files[0] as File
                if (!video.type.startsWith("video/")) {
                    return
                }
                const { dataURL, duration } = await extractThumbnail(video)
                setVideoFile(video)
                setGeneratedCoverDataURL(dataURL)
                setDuration(duration)
                setPhase(1)
                e.target.value = ''
            }
        },

        onPlusCategoryClicked: (e: React.MouseEvent) => {
            setAddingCategory(true)
            e.stopPropagation()
        },

        onTagInputChange: (e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value
            if (value.trim().length === 0) {
                if (fuzzyTags.length > 0) {
                    setFuzzyTags([])
                }
                return
            }

            const source = tagList.filter(tag => {
                const selectedWords = selectedTags.map(t => t.word)
                return !selectedWords.includes(tag)
            })
            const fzf = new Fzf(source)
            const entries = fzf.find(value)
            const items = entries.map(e => e.item)
            if (value.endsWith(' ')) {
                if (items.length === 0) {
                    const tag = tagMap[value.trim().toLocaleLowerCase()]
                    if (tag) {
                        setSelectedTags(old => [...old, tag])
                    }
                    setAddingCategory(false)
                    setFuzzyTags([])
                    return
                }
            }
            setFuzzyTags(items)
        },

        onDocumentClicked: (e: React.MouseEvent) => {
            const target = e.target as HTMLElement
            if (target && categoryInputDivRef.current) {
                if (!categoryInputDivRef.current.contains(target) && addingCategory) {
                    setAddingCategory(false)
                    setFuzzyTags([])
                }
            }
        },

        onCategoryClicked: (e: React.MouseEvent<HTMLAnchorElement>) => {
            const target = e.target as HTMLAnchorElement
            const val = target.innerText.trim()
            const tag = tagMap[val.toLowerCase()]
            setAddingCategory(false)
            setFuzzyTags([])
            setSelectedTags(tags => [...tags, tag])
        },

        onImageSelectBtnClicked: () => {
            if (imageFileInputRef.current) {
                imageFileInputRef.current.click()
            }
        },

        onImageFileSelected: async (ec: ChangeEvent<HTMLInputElement>) => {
            if (ec.target.files && ec.target.files[0]) {
                const file = ec.target.files[0] as File
                const reader = new FileReader()
                reader.readAsDataURL(file)
                await new Promise<void>(rev => {
                    reader.addEventListener('load', el => {
                        if (el.target?.result) {
                            selectedCoverDataURL.current = el.target.result as string
                            rev()
                        }
                    })
                })
                setChooseCover(false)
                setSelectedCover(file)
                setUseGeneratedCover(false)
                ec.target.value = ''
            }
        },

        onCancel: () => {
            dispatch(hideUploader())
        },

        onFormSubmit: async (e: React.FormEvent) => {
            e.preventDefault()
            if (phase > 1) {
                return
            }

            setSubmiting(true)

            if (!videoFile) {
                throw new Error('no video file selected')
            }
            if (!generatedCoverDataURL) {
                throw new Error('no generated thumbnail')
            }
            if (!useGeneratedCover && !selectedCover) {
                throw new Error('no selected cover')
            }

            let imageToUplaod: Blob | null = null
            if (useGeneratedCover) {
                imageToUplaod = dataURLToBlob(generatedCoverDataURL)
            } else if (selectedCover) {
                imageToUplaod = selectedCover
            }
            if (!imageToUplaod) {
                throw new Error('no cover image to upload')
            }

            const formData = new FormData(e.target as HTMLFormElement)
            const title = formData.get('title') as string
            if (!title || !title.trim()) {
                setTitleError('Title is required')
                return
            }
            const description = formData.get('description') as string
            if (!description || !description.trim()) {
                setDescError('Description is required')
                return
            }

            const signedURLReq: PostGetSignedURL = {
                videoName: videoFile.name,
                videoType: videoFile.type,
                imageType: imageToUplaod.type,
                imageName: '',
            }
            const resp = await axios.post(`/api/upload/signedURL?for=video`, signedURLReq)
            if (resp.status !== StatusCodes.OK) {
                throw new Error('failed to get signedURL')
            }
            const signedURL: SignedURLResp = resp.data

            setPhase(2)

            const totalSize = videoFile.size + imageToUplaod.size
            try {
                await axios.put(signedURL.videoSignedURL, videoFile,
                    {
                        headers: { 'Content-Type': videoFile.type },
                        onUploadProgress: (e: AxiosProgressEvent) => {
                            const { loaded } = e
                            let percentage = Math.floor((loaded * 100) / totalSize);
                            setUploadPercentage(percentage)
                        },
                    })
                await axios.put(signedURL.imageSignedURL, imageToUplaod,
                    {
                        onUploadProgress: (e: AxiosProgressEvent) => {
                            const { loaded } = e
                            let percentage = Math.floor(((loaded + videoFile.size) * 100) / totalSize);
                            setUploadPercentage(percentage)
                            if (percentage === 100) {
                                setPhase(3)
                            }
                        },
                        headers: { 'Content-Type': imageToUplaod.type }
                    })
            } catch (error) {
                throw new Error(`failed to upload data: ${error}`)
            }

            const videoMeta: PostVideoMeta = {
                title: title,
                description: description,
                name: videoFile.name,
                type: videoFile.type,
                size: videoFile.size,
                videoDest: signedURL.videoDest,
                thumbnailDest: signedURL.imageDest,
                tags: selectedTags.map(tag => tag.word),
            }
            await postVideoMeta(videoMeta).unwrap()
            setTimeout(() => {
                dispatch(hideUploader())
            }, 1000)
        }
    }

    useEffect(() => {
        const handleClickDocument = (e: MouseEvent) => {
            if (mainAeraRef.current && e.target) {
                if (!mainAeraRef.current.contains(e.target as HTMLElement) && phase === 0) {
                    dispatch(hideUploader())
                }
            }
        }
        document.addEventListener('click', handleClickDocument, true)
        return () => {
            document.removeEventListener('click', handleClickDocument, true);
        };
    }, [dispatch, phase])

    return (
        <>
            {
                phase === 0 &&
                <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50 py-10 z-10 transition-opacity duration-1000 opacity-100" >
                    <div className="max-h-full max-w-7xl overflow-auto sm:rounded-2xl" onDrop={eh.onFileDropped} onDragOver={e => { e.preventDefault() }}>
                        <div ref={mainAeraRef} className="grid place-content-center bg-gray-100 rounded-xl min-w-[64rem] min-h-[40rem]" >
                            <div className="flex flex-col justify-center items-center space-y-4">
                                <FaCloudArrowUp size={80} className="text-gray-500" />
                                <p className="font-semibold text-xl">Select video to upload</p>
                                <p className="">Or drag and drop it here</p>
                                <button className="bg-red-500 text-white px-12 py-2 rounded-lg" onClick={eh.onSelectBtnClicked}>Select</button>
                                <input ref={videoFileInputRef} type="file" accept="video/*" className="hidden" onChange={eh.onVideoFileSelected} />
                            </div>
                        </div>
                    </div>
                </div>
            }
            {
                phase > 0 && videoFile &&
                <div className="fixed left-0 top-0 flex h-full w-full justify-center bg-black bg-opacity-70 py-10 z-10" onClick={eh.onDocumentClicked}>
                    <div className="flex flex-col min-w-[64rem] gap-y-3">
                        <div className="w-full flex flex-row items-center px-6 py-4 gap-x-10 text-base rounded-xl shadow-lg bg-white">
                            <div className="basis-5/6 flex flex-row gap-x-6 items-center">
                                <p className="font-light w-1/2">File <span className="font-semibold ml-2">{videoFile.name}</span></p>
                                <p className="font-light">Size <span className="font-semibold ml-2">{convertSize(videoFile.size)}</span></p>
                                <p className="font-light">Duration <span className="font-semibold ml-2">{convertDuration(duration)}</span></p>
                            </div>
                            <p className="text-red-600"><IoCheckmarkCircle size={30} className="inline" /> Selected</p>
                        </div>
                        {
                            phase === 1 &&
                            <form className="flex flex-col p-6 rounded-xl shadow-lg bg-white overflow-y-auto" onSubmit={eh.onFormSubmit}>
                                <div className="relative flex flex-col">
                                    <label htmlFor="title" className="font-semibold m-2">Title</label>
                                    <input id='title' name='title' className="p-2 rounded-md" placeholder="give a title to your video" onChange={() => { setTitleError('') }} ></input>
                                    {titleError && <span className="absolute top-0 right-0 p-2 text-red-500 text-sm">{titleError}</span>}
                                </div>
                                <div className="relative flex flex-col">
                                    <label htmlFor="description" className="font-semibold m-2">Description</label>
                                    <textarea id="description" rows={6} name="description" placeholder="Describe your video here..." className="bg-gray-100 rounded-lg p-4 overflow-y-auto" onChange={() => { setDescError('') }}></textarea>
                                    {descError && <span className="absolute top-0 right-0 p-2 text-red-500 text-sm">{descError}</span>}
                                </div>
                                <div className="flex flex-row m-2 items-center">
                                    <label htmlFor="category" className="font-semibold">Categories</label>
                                    <div className="relative flex flex-row items-center gap-x-4 h-10">
                                        <div>
                                            {
                                                selectedTags.map(tag => <span key={tag.id} className="p-2 mx-2 text-sm bg-red-600 text-gray-50">{tag.word}</span>)
                                            }
                                        </div>
                                        {
                                            !addingCategory &&
                                            <FaCirclePlus size={20} className="hover:cursor-pointer" onClick={eh.onPlusCategoryClicked} />
                                        }
                                        {
                                            addingCategory &&
                                            <div className="relative" ref={categoryInputDivRef}>
                                                <input ref={categoryInputRef} className="p-2 focus:outline-none focus:border-none" autoFocus onChange={eh.onTagInputChange} onKeyDown={eh.onCategoryInputKeydown} />
                                                <hr />
                                                <div className="absolute top-0 left-0 mt-2 transform translate-y-10 z-10 font-light max-h-80 w-full rounded-lg overflow-auto bg-white">
                                                    {
                                                        fuzzyTags.map(name => (
                                                            <a key={tagMap[name.toLowerCase()].id} className="block hover:bg-blue-200 px-2 py-1 hover:cursor-pointer" onClick={eh.onCategoryClicked}>{name}</a>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        }
                                    </div>
                                </div>
                                <div className="relative flex flex-col">
                                    <div className="py-2">
                                        <label htmlFor="description" className="font-semibold m-2">Cover</label>
                                        {
                                            !chooseCover &&
                                            <span className="text-sm ml-2 py-1 px-2 font-light rounded-md bg-gray-300 text-black hover:cursor-pointer" onClick={() => { setChooseCover(true) }}>Select</span>
                                        }
                                        {
                                            !chooseCover && !useGeneratedCover &&
                                            <span className="text-sm ml-2 py-1 px-2 font-light rounded-md bg-gray-300 text-black hover:cursor-pointer" onClick={() => { setUseGeneratedCover(true) }}>Use default</span>
                                        }
                                    </div>
                                    {
                                        !chooseCover &&
                                        <div className="relative mt-2">
                                            <NextImage src={getVideoThumbanil()} width={thumbnailWidth} height={thumbnailHeight} alt="video-thumbnail" className="rounded-xl w-96 h-64" />
                                        </div>
                                    }
                                    {
                                        chooseCover &&
                                        <div className="relative grid place-content-center bg-gray-100 rounded-xl mt-2">
                                            <div className="flex flex-col justify-center items-center space-y-4 h-80">
                                                <FaCloudArrowUp size={70} className="text-gray-500" />
                                                <p className="font-semibold text-xl">Select an image</p>
                                                <p className="">Or drag and drop it here</p>
                                                <span className="bg-red-600 text-white px-12 py-2 rounded-lg hover:cursor-pointer" onClick={eh.onImageSelectBtnClicked}>Select</span>
                                                <input ref={imageFileInputRef} type="file" accept="image/*" className="hidden" onChange={eh.onImageFileSelected} />
                                            </div>
                                            <RxCrossCircled size={20} className="absolute top-2 left-2 hover:cursor-pointer" onClick={() => { setChooseCover(false) }} />
                                        </div>
                                    }
                                    {
                                        !submiting &&
                                        <div className="flex flex-row absolute bottom-0 right-0 gap-x-2">
                                            <button type="submit" className="py-2 px-4 bg-red-600 text-white rounded-lg">Submit</button>
                                            <button type="button" className="py-2 px-4 bg-gray-600 text-white rounded-lg" onClick={eh.onCancel}>Cancel</button>
                                        </div>
                                    }
                                    {
                                        submiting &&
                                        <div className="flex flex-row absolute bottom-0 right-0 gap-x-2">
                                            <button type="button" className="py-2 px-4 bg-red-400 text-white rounded-lg hover:cursor-pointer">Loading...</button>
                                        </div>
                                    }
                                </div>
                            </form>
                        }
                        {
                            phase >= 2 &&
                            <>
                                <div className="w-full flex flex-row items-center px-6 py-4 gap-x-10 text-base rounded-xl shadow-lg bg-white">
                                    <div className="basis-5/6 flex flex-row gap-x-6 items-center">
                                        <div className="bg-gray-200 rounded-full h-1 w-full">
                                            <div
                                                className="bg-red-700 h-1 rounded-full"
                                                style={{ width: `${uploadPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    {
                                        uploadPercentage != 100 &&
                                        <p className="text-red-600 text-end">{uploadPercentage}%</p>
                                    }
                                    {
                                        uploadPercentage === 100 &&
                                        <p className="text-red-600 text-end"><IoCheckmarkCircle size={30} className="inline" />Uploaded</p>
                                    }
                                </div>
                            </>
                        }
                        {
                            phase >= 3 &&
                            <div className="w-full flex flex-row items-center px-6 py-4 gap-x-4 text-base rounded-xl shadow-lg bg-white">
                                {
                                    phase === 3 &&
                                    <>
                                        <p className="">Wait for the processing...</p>
                                        <div role="status">
                                            <svg aria-hidden="true" className="inline w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-red-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                            </svg>
                                            <span className="sr-only">Loading...</span>
                                        </div>
                                    </>
                                }
                            </div>
                        }
                    </div>
                </div>
            }
        </>
    )
}

async function extractThumbnail(videoFile: File): Promise<{ dataURL: string, duration: number }> {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.addEventListener('loadeddata', () => {
        video.currentTime = 2;
    });

    const canvas = document.createElement('canvas')
    canvas.height = thumbnailHeight
    canvas.width = thumbnailWidth
    const dataURLPromise = new Promise<string>((resolve, reject) => {
        video.addEventListener('seeked', () => {
            // Draw the frame onto the canvas
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL)
                URL.revokeObjectURL(video.src);
            }
        }, { once: true });
        video.addEventListener('error', reject, { once: true })
        video.load();
    })
    const durationPromise = new Promise<number>(rev => {
        video.addEventListener('loadedmetadata', () => {
            rev(video.duration)
        })
    })
    const dataURL = await dataURLPromise
    const duration = await durationPromise
    return { dataURL, duration }
}