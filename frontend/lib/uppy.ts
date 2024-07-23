import Uppy from '@uppy/core';
import GoogleDrive from '@uppy/google-drive';
import Transloadit, { COMPANION_ALLOWED_HOSTS, COMPANION_URL } from '@uppy/transloadit';
import ThumbnailGenerator from '@uppy/thumbnail-generator';

export const GET_ASSEMBLY_OPTIONS = "assemblyOptions"

export function createUppy(meta: Object) {
    return new Uppy(meta)
        .use(ThumbnailGenerator)
        .use(GoogleDrive, {
            companionUrl: COMPANION_URL,
            companionAllowedHosts: COMPANION_ALLOWED_HOSTS,
        })
        .use(Transloadit, {
            // see https://uppy.io/docs/transloadit/#assemblyoptions for explanations
            async assemblyOptions() {
                const res = await fetch('/api/transloadit/' + GET_ASSEMBLY_OPTIONS, { method: 'GET' })
                const opts = await res.json()
                return { ...opts, fields: meta }
            },
        })
}