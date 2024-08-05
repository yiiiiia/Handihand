import { asyncThunkCreator, buildCreateSlice } from "@reduxjs/toolkit";
import crypto from 'crypto';

export const emailRegex = /(?:[a-z0-9+!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i

// `buildCreateSlice` allows us to create a slice with async thunks.
export const createAppSlice = buildCreateSlice({
    creators: { asyncThunk: asyncThunkCreator },
});

export function randToken() {
    return crypto.randomBytes(32).toString('hex')
}

export function visibleOnCondition(cond: boolean, baseTheme: string) {
    if (!cond) {
        return baseTheme + " invisible"
    }
    return baseTheme
}

// Function to get the URL of the object in google cloud bucket
export function getBucketObjectPublicURL(bucketName: string, fileName: string) {
    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}

export function getFileExtension(mimeType: string): string {
    if (!mimeType.startsWith('image/')) {
        return ''
    }
    const idx = mimeType.lastIndexOf('/')
    const format = mimeType.substring(idx + 1)
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