'use client'

import { Tag } from "@/lib/db/entities";
import { hideUploader, selectShowUploader } from "@/lib/features/uploader/uploaderSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { dataURLToBlob, getFileExtension } from "@/lib/util";
import { Fzf } from 'fzf';
import NextImage from "next/image";
import React, { ChangeEvent, useRef, useState } from "react";
import { FaCirclePlus, FaCloudArrowUp } from "react-icons/fa6";
import { IoCheckmarkCircle } from "react-icons/io5";
import { RxCrossCircled } from "react-icons/rx";

const thumbnailHeight = 375
const thumbnailWidth = 500

type Phase = 'chooseFile' | 'fileSelected' | 'uploading' | 'done'

export default function VideoUpload({ tags }: { tags: Tag[] }) {
    const dispatch = useAppDispatch()
    const showUploader = useAppSelector(selectShowUploader)
    const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
    const [generatedCoverDataURL, setGeneratedCoverDataURL] = useState('')
    const [selectedCover, setSelectedCover] = useState<File | null>(null)
    const selectedCoverDataURL = useRef('')
    const [duration, setDuration] = useState(0)
    const [phase, setPhase] = useState<Phase>('chooseFile')
    const [addingCategory, setAddingCategory] = useState(false)
    const [fuzzyTags, setFuzzyTags] = useState<string[]>([])
    const [selectedTags, setSelectedTags] = useState<Tag[]>([])
    const [chooseCover, setChooseCover] = useState(false)
    const [useGeneratedCover, setUseGeneratedCover] = useState(true)
    const [descError, setDescError] = useState('')
    const [titleError, setTitleError] = useState('')
    const [loading, setLoading] = useState(false)

    const videoFileInputRef = useRef<HTMLInputElement>(null)
    const imageFileInputRef = useRef<HTMLInputElement>(null)
    const categoryInputRef = useRef<HTMLInputElement>(null)
    const categoryInputDivRef = useRef<HTMLDivElement>(null)

    const tagMap: Record<string, Tag> = {}
    const tagList = tags.map(t => t.word)
    tags.forEach(t => {
        tagMap[t.word.toLowerCase()] = t
    })

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

        onVideoFileSelected: async (e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                const video = e.target.files[0] as File
                const { dataURL, duration } = await extractThumbnail(video)
                setSelectedVideoFile(video)
                setGeneratedCoverDataURL(dataURL)
                setDuration(duration)
                setPhase('fileSelected')
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

        onFormKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
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

        onFormSubmit: async (e: React.FormEvent) => {
            e.preventDefault()
            if (loading) {
                return
            }
            setLoading(true)
            if (!selectedVideoFile) {
                throw new Error('no video file selected')
            }
            if (!generatedCoverDataURL) {
                throw new Error('no generated thumbnail')
            }
            if (!useGeneratedCover && !selectedCover) {
                throw new Error('no selected cover')
            }

            const form = e.target as HTMLFormElement
            const formData = new FormData(form)
            const description = formData.get('description') as string
            if (!description || !description.trim()) {
                setDescError('Description is required')
                return
            }
            const title = formData.get('title') as string
            if (!title || !title.trim()) {
                setTitleError('Title is required')
                return
            }

            const videoFileExt = getFileExtension(selectedVideoFile.type)
            if (!videoFileExt) {
                throw new Error(`unsupported video file type: ${selectedVideoFile.type}`)
            }

            formData.append('video', selectedVideoFile, selectedVideoFile.name)
            if (useGeneratedCover) {
                const blob = dataURLToBlob(generatedCoverDataURL)
                if (!blob) {
                    throw new Error('failed to get blob from data url')
                }
                formData.append('cover', blob)
            } else {
                if (selectedCover) {
                    formData.append('cover', selectedCover)
                } else {
                    throw new Error('no selected cover available')
                }
            }
            if (selectedTags.length > 0) {
                selectedTags.forEach(tag => {
                    formData.append('tag', tag.word)
                })
            }

            await fetch('/api/upload/video', {
                method: 'post',
                body: formData
            }).catch(err => {
                throw new Error(`failed to upload video, error: ${err}`)
            }).then(() => {
                setLoading(false)
                dispatch(hideUploader())
            })
        }
    }

    if (showUploader) {
        return (
            <>
                {
                    phase === 'chooseFile' &&

                    <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50 py-10">
                        <div className="max-h-full max-w-7xl overflow-auto sm:rounded-2xl">
                            <div className="grid place-content-center bg-gray-100 rounded-xl min-w-[64rem] min-h-[40rem]">
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
                    (phase === 'fileSelected' || phase === 'uploading') && selectedVideoFile &&
                    <div className="fixed left-0 top-0 flex h-full w-full justify-center bg-black bg-opacity-70 py-10" onClick={eh.onDocumentClicked}>
                        <div className="flex flex-col min-w-[64rem] gap-y-3">
                            <div className="w-full flex flex-row items-center px-6 py-4 gap-x-10 text-base rounded-xl shadow-lg bg-white">
                                <p className="font-light">File <span className="font-semibold ml-2">{selectedVideoFile.name}</span></p>
                                <p className="font-light">Size <span className="font-semibold ml-2">{convertSize(selectedVideoFile.size)}</span></p>
                                <p className="font-light">Duration <span className="font-semibold ml-2">{convertDuration(duration)}</span></p>
                                <p className="text-teal-500 text-end grow"><IoCheckmarkCircle size={30} className="inline" /> Selected</p>
                            </div>
                            <form className="flex flex-col p-6 rounded-xl shadow-lg bg-white overflow-y-auto" onKeyDown={eh.onFormKeyDown} onSubmit={eh.onFormSubmit}>
                                <div className="relative flex flex-col">
                                    <label htmlFor="title" className="font-semibold m-2">Title</label>
                                    <input id='title' name='title' className="p-2 rounded-md" placeholder="give a title to your video" ></input>
                                    {titleError && <span className="absolute top-0 right-0 p-2 text-red-500 text-sm">{titleError}</span>}
                                </div>
                                <div className="relative flex flex-col">
                                    <label htmlFor="description" className="font-semibold m-2">Description</label>
                                    <textarea id="description" rows={6} name="description" placeholder="Describe your video here..." className="bg-gray-100 rounded-lg p-4 overflow-y-auto"></textarea>
                                    {descError && <span className="absolute top-0 right-0 p-2 text-red-500 text-sm">{descError}</span>}
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="category" className="font-semibold m-2">Categories</label>
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
                                                <input ref={categoryInputRef} className="p-2 focus:outline-none focus:border-none" onChange={eh.onTagInputChange} autoFocus />
                                                <hr />
                                                <div className="absolute top-0 left-0 mt-2 transform translate-y-10 z-10 font-light max-h-80 w-full rounded-lg overflow-auto bg-neutral-100">
                                                    {
                                                        fuzzyTags.map(name => (
                                                            <a key={tagMap[name.toLowerCase()].id} className="block hover:bg-blue-200 px-2 py-1 hover:cursor-pointer text-sm" onClick={eh.onCategoryClicked}>{name}</a>
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
                                            <NextImage src={getVideoThumbanil()} width={thumbnailWidth} height={thumbnailHeight} alt="video-thumbnail" className="rounded-xl" />
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
                                    {!loading && <button className="absolute bottom-0 right-0 py-2 px-4 bg-red-600 text-white rounded-lg">Submit</button>}
                                    {loading && <button disabled className="absolute bottom-0 right-0 py-2 px-4 bg-red-300 text-white rounded-lg hover:cursor-not-allowed">Processing...</button>}
                                </div>
                            </form>
                        </div>
                    </div>
                }
            </>
        )
    }
}

async function extractThumbnail(videoFile: File): Promise<{ dataURL: string, duration: number }> {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.addEventListener('loadeddata', () => {
        // Set the time to the desired frame (e.g., 5 seconds)
        video.currentTime = 5;
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