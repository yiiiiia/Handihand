import { createAppSlice } from "@/lib/createAppSlice";
import { Video } from "@/lib/db/entities";
import { PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type SearchBy = 'video' | 'product'

export interface SearchParams {
    country: string,
    keyword: string,
    searchBy: SearchBy,
    tags: string[],
    pageNumber: number,
    pageSize: number,
}

const initialState: SearchParams = {
    country: '',
    keyword: '',
    searchBy: 'video',
    tags: [],
    pageNumber: 1,
    pageSize: 20
}

export const searchSlice = createAppSlice({
    name: 'tag',
    initialState,
    reducers: (create) => ({
        setCountry: create.reducer((state, action: PayloadAction<string>) => {
            state.country = action.payload.trim()
        }),
        setKeyword: create.reducer((state, action: PayloadAction<string>) => {
            state.keyword = action.payload.trim()
        }),
        setSearchBy: create.reducer((state, action: PayloadAction<SearchBy>) => {
            state.searchBy = action.payload
        }),
        setTags: create.reducer((state, action: PayloadAction<string[]>) => {
            state.tags = action.payload
        }),
        setPageNumber: create.reducer((state, action: PayloadAction<number>) => {
            state.pageNumber = action.payload
        }),
        setPageSize: create.reducer((state, action: PayloadAction<number>) => {
            state.pageSize = action.payload
        }),
    }),
    selectors: {
        selectSearchParams: state => state
    }
})

export const { setCountry, setKeyword, setSearchBy, setTags, setPageNumber, setPageSize } = searchSlice.actions

export const { selectSearchParams } = searchSlice.selectors

export interface SearchVideoResponse {
    videos: Video[],
}

export interface SearchMyUploadedVideosResponse {
    number: number
}

export const searchApiSlice = createApi({
    baseQuery: fetchBaseQuery({ baseUrl: '/api/videos/' }),
    reducerPath: 'searchApi',
    tagTypes: ["VideoSearch"],
    endpoints: (build) => ({
        getVideos: build.query<SearchVideoResponse, SearchParams>({
            query({ country, keyword, tags, pageNumber, pageSize }) {
                if (pageNumber <= 0) {
                    pageNumber = 1
                }
                if (pageSize <= 0 || pageSize > 50) {
                    pageSize = 20
                }
                const qtag = tags.join(',')
                return `all?countryCode=${country}&keyword=${keyword}&tags=${qtag}&pageNumber=${pageNumber}&pageSize=${pageSize}`
            },
        }),
        getUploadedVideos: build.query<SearchMyUploadedVideosResponse, void>({
            query: () => 'my-videos'
        })
    })
})

export const { useLazyGetVideosQuery, useGetVideosQuery, useGetUploadedVideosQuery } = searchApiSlice