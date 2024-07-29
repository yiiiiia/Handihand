'use client'

import { recordUploadedVideo, VideoUploadRecord } from '@/lib/action/file_upload';
import { hideUploader, selectShowUploader } from '@/lib/features/uploader/uploaderSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { createUppy } from '@/lib/uppy';
import { UploadResult } from '@uppy/core';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { Dashboard } from '@uppy/react';
import { FormEvent, MutableRefObject, useEffect, useRef, useState } from 'react';
import { VscError } from "react-icons/vsc";
import { z } from 'zod';

const schema = z.object({
    title: z.string({ required_error: 'title is required' })
        .trim()
        .min(1, { message: 'title cannot be empty' })
        .max(50, { message: 'title cannot be longer than 50 characters' }),
    description: z.string({ required_error: 'description is required' })
        .trim()
        .min(1, { message: 'description cannot be empty' }),
    fileNum: z.number({ required_error: 'no file choosen' })
        .min(1, { message: 'no choosen file' })
        .max(1, { message: 'you can only uplaod 1 file at a time' })
})

type SchemaType = z.infer<typeof schema>

type UploaderState = 'initialized' | 'fileChoosen' | 'uploading' | 'finished' | 'uploadError'

type AppState = {
    state: UploaderState,
    error: z.ZodFormattedError<SchemaType, string> | null
}

const initAppState: AppState = {
    state: 'initialized',
    error: null
}

export default function Uploader() {
    const [uppy] = useState(() => createUppy({
        restrictions: {
            maxNumberOfFiles: 1,
            allowedFileTypes: ['.mp4', '.mov', '.wvm', '.flv', '.avi'],
        }
    }));

    uppy.on('file-added', (file) => {
        if (uppy.getFiles.length > 1) {
            uppy.removeFile(file.id)
            return
        }
        setAppState(old => ({ ...old, state: 'fileChoosen' }))
    })

    uppy.on('file-removed', () => {
        setAppState(old => ({ ...old, state: 'initialized' }))
    })

    uppy.on('error', (error) => {
        console.log(error);
    });

    let ref: MutableRefObject<any> | null = useRef(null);
    const dispatch = useAppDispatch()
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target)) {
                dispatch(hideUploader())
            }
        };
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, [ref, dispatch]);

    const [appState, setAppState] = useState<AppState>(initAppState)

    const handleUploadClick = async (e: FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        const formValue = {
            title: formData.get('title'),
            description: formData.get('description'),
            fileNum: uppy.getFiles().length,
        }
        const parsedFormValue = schema.safeParse(formValue)
        if (!parsedFormValue.success) {
            setAppState(old => ({ ...old, error: parsedFormValue.error.format() }))
            return
        }

        setAppState(old => ({ ...old, state: 'uploading' }))
        const result = await uppy.upload()
        console.log('uplaod result: ', JSON.stringify(result))
        if (result && result.successful && result.successful.length > 0) {
            await recordUploadResult(result, parsedFormValue.data.title, parsedFormValue.data.description, [])
            setAppState(old => ({ ...old, state: 'finished' }))
        } else {
            setAppState(old => ({ ...old, state: 'uploadError' }))
        }
    }

    const resetDashboard = () => {
        uppy.clear()
        setAppState(initAppState)
    }

    const retryUpload = () => {
        uppy.retryAll()
        setAppState(old => ({ ...old, state: 'uploading' }))
    }

    const button = (state: UploaderState) => {
        if (state === 'fileChoosen') {
            return <button type='submit' className='p-3 bg-red-700 text-white absolute bottom-10 left-6 w-1/3 min-w-40 rounded-lg' aria-disabled={false}>Upload</button>
        } else if (state === 'uploading') {
            return <button className='p-3 bg-red-700 text-white absolute bottom-10 left-6 w-1/3 min-w-40 rounded-lg' aria-disabled={true}>Processing...</button>
        } else if (state === 'finished') {
            return <button className='p-3 bg-green-300 text-gray-700 absolute bottom-10 left-6 w-1/3 min-w-40 rounded-lg' aria-disabled={true} onClick={resetDashboard}>Done</button>
        } else if (state === 'uploadError') {
            return <button className='p-3 bg-red-700 text-white absolute bottom-10 left-6 w-1/3 min-w-40 rounded-lg' aria-disabled={true} onClick={retryUpload}>Retry</button>
        }
    }

    const showAttachedForm = () => {
        const visibleStates = ['fileChoosen', 'uploading', 'finished', 'uploadError']
        if (visibleStates.includes(appState.state)) {
            return (
                <form className='relative flex flex-col px-4 py-4 w-[400px]' onSubmit={handleUploadClick}>
                    <fieldset disabled={appState.state === 'uploading'}>
                        <div className='p-2'>
                            <label htmlFor='title' className='block'>Add Title</label>
                            <input id="title" type='text' name="title" className={disableWhileUploding('bg-gray-50 p-2 border rounded-md', appState.state, 'hover:cursor-not-allowed')} />
                        </div>
                        {appState.error?.title?._errors && (<span className='text-red-700 text-sm p-2'><VscError size={16} className="inline-block mr-2" />{appState.error.title?._errors[0]}</span>)}
                        <div className='p-2'>
                            <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Add Description</label>
                            <textarea id="description" name="description" rows={12} className={disableWhileUploding("block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500", appState.state, "hover:cursor-not-allowed")} placeholder="Write your thoughts here..." />
                        </div>
                        {appState.error?.description?._errors && (<span className='text-red-700 text-sm p-2'><VscError size={16} className="inline-block mr-2" />{appState.error.description?._errors[0]}</span>)}
                        <div className="p-2">
                            <Tags state={appState.state} />
                        </div>
                        {appState.error?.fileNum?._errors && (<span className='text-red-700 text-sm p-2'><VscError size={16} className="inline-block mr-2" />{appState.error.fileNum._errors[0]}</span>)}
                        {button(appState.state)}
                    </fieldset>
                </form>
            )
        }
    }

    const showUploader = useAppSelector(selectShowUploader)
    return (
        showUploader &&
        <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50 py-10">
            <div className="max-h-full max-w-full overflow-y-auto sm:rounded-2xl bg-white" ref={ref}>
                <div className="flex flex-row">
                    <Dashboard uppy={uppy} width={800} height={750} hideUploadButton={true} hideRetryButton={true} doneButtonHandler={resetDashboard} />
                    <div id='#dashboard'></div>
                    {showAttachedForm()}
                </div>
            </div>
        </div>
    )
}

function Tags({ state }: { state: UploaderState }) {
    const words = ['football', 'apple', 'pineapple', 'orange', 'java', 'phthon', 'javascript', 'women', 'girl', 'man', 'terrorist', 'emperor', 'murderer']
    return (
        <div>
            <div className='w-20'>
                <input name='tag' placeholder='add tags...' className={disableWhileUploding('italic font-mono text-sm text-gray-700 p-2 focus:border-none focus:outline-none', state, 'hover:cursor-not-allowed')} />
            </div>
        </div>
    )
}

function disableWhileUploding(theme: string, state: UploaderState, disableTheme: string): string {
    if (state == 'uploading') {
        return theme + ' ' + disableTheme
    } else {
        return theme
    }
}

async function recordUploadResult(result: UploadResult<any, any>, title: string, description: string, tags: string[]) {
    if (result.successful && result.successful.length > 0) {
        const success = result.successful[0]
        const record: VideoUploadRecord = {
            upload_id: result.uploadID ?? '',
            assembly_id: success.transloadit?.assembly ?? '',
            name: success.name ?? '',
            type: success.type,
            size: success.size ?? 0,
            upload_url: success.uploadURL ?? '',
            assembly_url: success.meta.assembly_url,
            meta: {
                title: title,
                description: description,
                tags: tags
            }
        }
        await recordUploadedVideo(record)
    }
}