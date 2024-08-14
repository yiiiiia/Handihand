'use client'

import { PostPhotoMeta, usePostPhotoMetaMutation } from "@/lib/features/searcher/searcher"
import { getFileExtension } from "@/lib/util"
import axios from "axios"
import { StatusCodes } from "http-status-codes"
import Image from "next/image"
import { memo, useEffect, useRef, useState } from "react"
import AvatarEditor from "react-avatar-editor"
import { FiMinusCircle, FiPlusCircle } from "react-icons/fi"
import { RxCross2 } from "react-icons/rx"
import { PostGetSignedURL, SignedURLResp } from "../api/upload/[action]/route"

const SIDE_LENGTH = 440
const RADIUS = 220

type Options = {
    onUploadComplete: (dataUrl: string) => void;
    selectedFile: File | null;
}

type Status = 'idle' | 'loading' | 'loaded' | 'editing' | 'uploading' | 'exiting'

type State = {
    status: Status;
    editor: {
        x: number;
        y: number;
        scale: number;
    }
}

const initState: State = {
    status: 'idle',
    editor: {
        x: 0.5,
        y: 0.5,
        scale: 1.0,
    }
}

export default function ImageUpload(opts: Options) {
    const [postPhotoMeta] = usePostPhotoMetaMutation()
    const [state, setState] = useState<State>(initState)
    const editorRef = useRef<AvatarEditor>(null)
    const editorStateRef = useRef(state.editor)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const dataUrlRef = useRef<string | null>(null)

    const eh = {
        exit: function () {
            setState(old => ({ ...old, status: 'exiting' }))
            dataUrlRef.current = null
            canvasRef.current = null
            setTimeout(() => {
                setState(initState)
            }, 1000)
        },

        edit: function () {
            setState(old => ({ ...old, status: 'editing' }))
        },

        cancelEdit: function () {
            setState(old => ({ ...old, status: 'loaded', editor: editorStateRef.current }))
        },

        editDone: function () {
            editorStateRef.current = state.editor
            if (editorRef.current) {
                const canvas = editorRef.current.getImage()
                canvasRef.current = canvas
                dataUrlRef.current = canvas.toDataURL()
            }
            setState(old => ({ ...old, status: 'loaded' }))
        },

        updateEditorPos: function (pos: { x: number, y: number }) {
            setState(old => ({ ...old, editor: { ...old.editor, x: pos.x, y: pos.y } }))
        },

        incrScale: function () {
            setState(old => ({ ...old, editor: { ...old.editor, scale: old.editor.scale + 0.2 } }))
        },

        decrScale: function () {
            setState(old => ({ ...old, editor: { ...old.editor, scale: old.editor.scale - 0.2 } }))
        },

        resetScale: function () {
            setState(old => ({ ...old, editor: { ...old.editor, scale: 1.0 } }))
        },

        upload: async function () {
            if (state.status === 'uploading') {
                return
            }
            if (!opts.selectedFile) {
                throw new Error(`no file selected`)
            }
            if (!dataUrlRef.current) {
                throw new Error(`no data url produced`)
            }
            const fileExt = getFileExtension(opts.selectedFile.type)
            if (!fileExt) {
                throw new Error(`cannot handle file with type: ${opts.selectedFile.type}`)
            }

            setState(old => ({ ...old, status: 'uploading' }))

            const blobToUpload = await new Promise<Blob | null>(resolve => {
                if (canvasRef.current) {
                    canvasRef.current.toBlob(async blob => {
                        if (!blob) {
                            throw new Error('no blob converted from a canvas!')
                        }
                        resolve(blob)
                    }, fileExt)
                } else {
                    resolve(opts.selectedFile)
                }
            })
            if (!blobToUpload) {
                throw new Error('no blob to upoad')
            }

            const signedURLReq: PostGetSignedURL = {
                imageName: opts.selectedFile.name,
                imageType: opts.selectedFile.type,
                videoName: '',
                videoType: '',
            }
            const resp = await axios.post(`/api/upload/signedURL?for=photo`, signedURLReq)
            if (resp.status !== StatusCodes.OK) {
                throw new Error('failed to get signedURL')
            }

            const signedURL: SignedURLResp = resp.data
            try {
                await axios.put(signedURL.imageSignedURL, blobToUpload, {
                    headers: { 'Content-Type': opts.selectedFile.type }
                })
            } catch (error) {
                throw new Error(`failed to upload image: ${error}`)
            }

            const photoMeta: PostPhotoMeta = {
                photoDest: signedURL.imageDest
            }
            await postPhotoMeta(photoMeta).unwrap()
            opts.onUploadComplete(dataUrlRef.current)
        }
    }


    useEffect(() => {
        if (opts.selectedFile) {
            setState(old => ({ ...old, status: 'loading' }))
            const reader = new FileReader()
            reader.readAsDataURL(opts.selectedFile)
            reader.addEventListener('load', le => {
                if (le.target?.result) {
                    dataUrlRef.current = le.target.result as string
                    setState(old => ({ ...old, status: 'loaded' }))
                }
            })
        }
    }, [opts.selectedFile])

    if (state.status === 'idle') {
        return (
            <></>
        )
    }

    if (['loaded', 'uploading', 'exiting'].includes(state.status) && dataUrlRef.current) {
        let theme = "fixed left-0 top-0 h-full w-full flex  items-center justify-center bg-black bg-opacity-50 py-10"
        if (state.status === 'loading') {
            theme += ' animate-fadeIn'
        } else if (state.status === 'exiting') {
            theme += ' animate-fadeOut'
        }

        return (
            <div className={theme}>
                <div className="flex flex-col bg-black shadow-2xl rounded-xl w-[720px] h-[900px]">
                    <div className="flex flex-row justify-between items-center w-full bg-neutral-900 rounded-t-xl p-4">
                        <RxCross2 size={20} className="text-white mx-2 hover:cursor-pointer" onClick={eh.exit} />
                        <p className="text-white text-center">Preview</p>
                        <p className="text-white mx-2 hover:cursor-pointer">Tips</p>
                    </div>
                    <div className="relative grid place-items-center grow">
                        <ImageViewer imageURL={dataUrlRef.current} />
                    </div>
                    <div className="flex flex-row justify-between items-center h-28 bg-neutral-900 rounded-xl">
                        <p className="text-base text-white hover:cursor-pointer ml-6" onClick={eh.edit}>Edit photo</p>
                        {
                            state.status === 'loaded' &&
                            <p className="text-base text-white px-4 py-3 rounded-lg mr-6 bg-rose-600 hover:cursor-pointer" onClick={async () => { await eh.upload(); eh.exit() }}>Use this photo</p>
                        }
                        {
                            state.status === 'uploading' &&
                            <p className="text-base text-white px-4 py-3 rounded-lg mr-6 bg-rose-400 hover:cursor-not-allowed">Uploading...</p>
                        }
                    </div>
                </div>
            </div>
        )
    }

    if (state.status === 'editing' && opts.selectedFile) {
        return (
            <div className="fixed left-0 top-0 h-full w-full flex  items-center justify-center bg-black bg-opacity-50 py-10">
                <div className="flex flex-col bg-black shadow-2xl rounded-xl w-[720px] h-[900px]">
                    <div className="flex flex-row justify-between items-center w-full bg-neutral-900 rounded-t-xl p-4">
                        <p className="text-white mx-2 hover:cursor-pointer" onClick={eh.cancelEdit} >Cancel</p>
                        <p className="text-white text-center">Preview</p>
                        <p className="text-white mx-2 hover:cursor-pointer" onClick={eh.editDone}>Done</p>
                    </div>
                    <div className="relative grid place-items-center grow">
                        <AvatarEditor
                            ref={editorRef}
                            image={opts.selectedFile}
                            width={SIDE_LENGTH}
                            height={SIDE_LENGTH}
                            borderRadius={RADIUS}
                            position={{ ...state.editor }}
                            scale={state.editor.scale}
                            onPositionChange={eh.updateEditorPos}
                        />
                    </div>
                    <div className="flex flex-row justify-between items-center h-28 bg-neutral-900 rounded-xl">
                        <div className='flex flex-row justify-center items-center mx-auto bg-neutral-800 rounded-xl text-gray-200'>
                            <div className='flex flex-row justify-around border-r-2 border-r-gray-500 px-4 space-x-3'>
                                <FiMinusCircle size={25} className={state.editor.scale <= 1.0 ? 'hover:cursor-not-allowed text-gray-500' : 'hover: cursor-pointer'} onClick={eh.decrScale} />
                                <FiPlusCircle size={25} className={state.editor.scale >= 2.0 ? 'hover:cursor-not-allowed text-gray-500' : 'hover: cursor-pointer'} onClick={eh.incrScale} />
                            </div>
                            <button className='text-sm p-4 mx-2' onClick={eh.resetScale}>Reset</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const ImageViewer = memo(function ImageViewer({ imageURL }: { imageURL: string }) {
    return <Image src={imageURL} width={SIDE_LENGTH} height={SIDE_LENGTH} alt="choose-avatar-file" style={{ clipPath: `circle(${RADIUS}px at center)` }} />
})