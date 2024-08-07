import { asyncThunkCreator, buildCreateSlice } from "@reduxjs/toolkit";
import crypto from 'crypto';
import { cookies } from "next/headers";

export const emailRegex = /(?:[a-z0-9+!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i

// `buildCreateSlice` allows us to create a slice with async thunks.
export const createAppSlice = buildCreateSlice({
    creators: { asyncThunk: asyncThunkCreator },
});

export const COOKIE_SESSION = '__sessionid__'

export const COOKIE_OAUTH_GOOGLE_STATE = "__oauth-google-state__"

export const COOKIE_CSRF = '__csrf__'

export function randToken() {
    return crypto.randomBytes(32).toString('hex')
}

export function visibleOnCondition(cond: boolean, baseTheme: string) {
    if (!cond) {
        return baseTheme + " invisible"
    }
    return baseTheme
}

export function dataURLToBlob(dataURL: string): Blob {
    // Split the data URL at the comma to separate the metadata from the base64 data
    const [metadata, base64String] = dataURL.split(',');

    // Decode the base64 string into binary data
    const binaryString = atob(base64String);

    // Convert binary data to an array of unsigned 8-bit integers
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // Extract the MIME type from the metadata
    const mimeType = metadata.split(':')[1].split(';')[0];

    // Create a Blob from the binary data with the specified MIME type
    return new Blob([bytes], { type: mimeType });
}

export function getFileExtension(mimeType: string): string {
    const idx = mimeType.lastIndexOf('/')
    const format = mimeType.substring(idx + 1)
    if (mimeType.startsWith('image')) {
        switch (format) {
            case 'jpeg':
                return 'jpg'
            case 'png':
                return 'png'
            case 'gif':
                return 'gif'
            case 'bmp':
                return 'bmp'
            case 'webp':
                return 'webp'
            case 'tiff':
                return 'tiff'
            case 'svg+xml':
                return 'svg'
            case 'x-icon':
                return 'ico'
            case 'heic':
                return 'heic'
            default:
                return ''
        }
    }
    if (mimeType.startsWith('video')) {
        switch (format) {
            case 'x-msvideo':
                return 'avi'
            case 'mp4':
                return 'mp4'
            case 'mpeg':
                return 'mpeg'
            case 'ogg':
                return 'ogv'
            case 'mp2t':
                return 'ts'
            case 'webm':
                return 'webm'
            default:
                return ''
        }
    }
    return ''
}