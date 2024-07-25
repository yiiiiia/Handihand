'use client'

import { hideUploader, selectShowUploader } from '@/lib/features/uploader/uploaderSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { createUppy } from '@/lib/uppy';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { Dashboard, useUppyEvent } from '@uppy/react';
import { MutableRefObject, useEffect, useRef, useState } from 'react';

export default function Uploader() {
    const [uppy] = useState(() => createUppy({ env: "testing" }));
    useUppyEvent(uppy, 'transloadit:assembly-created', (args) => {
        // TODO add backend logic
        console.log('transloadit:assembly-created ----- ', args)
    })

    const dispatch = useAppDispatch()
    let ref: MutableRefObject<any> | null
    ref = useRef(null);
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
    const show = useAppSelector(selectShowUploader)
    if (show) {
        return (
            <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50">
                <div ref={ref}>
                    <Dashboard waitForThumbnailsBeforeUpload={true} uppy={uppy} />
                </div>
            </div>
        )
    } else {
        return null
    }
} 