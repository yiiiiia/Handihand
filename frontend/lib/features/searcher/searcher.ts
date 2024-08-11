import { createAppSlice } from "@/lib/createAppSlice";
import { Tag, Video } from "@/lib/db/entities";
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

export interface GetLike {
    accountId: number;
    videoId: number;
}

export interface GetLikeResp {
    hasLiked: boolean;
    likes: number;
}

export interface GetSave {
    accountId: number;
    videoId: number;
}

export interface GetSaveResp {
    hasSaved: boolean;
    saves: number;
}

export interface PostLike {
    videoId: number;
    accountId: number;
    reqType: 'add' | 'remove'
}

export interface PostSave {
    videoId: number;
    accountId: number;
    reqType: 'add' | 'remove'
}

export interface CommentInfo {
    videoId: number;
    accountId: number;
    commentId: number;
    photo: string;
    username: string;
    comment: string;
    createdAt: string;
}

export interface PostComment {
    accountId: number,
    videoId: number,
    comment: string
}

export const searchApiSlice = createApi({
    baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
    reducerPath: 'searchApi',
    tagTypes: ["likes", "saves", 'comments'],
    endpoints: (build) => ({
        getVideos: build.query<SearchVideoResponse, SearchParams>({
            query({ searchBy, country, keyword, tags, pageNumber, pageSize }) {
                if (pageNumber <= 0) {
                    pageNumber = 1
                }
                if (pageSize <= 0 || pageSize > 50) {
                    pageSize = 20
                }
                const qtag = tags.join(',')
                const qstr = `/videos/all?searchBy=${searchBy}&countryCode=${country}&keyword=${keyword}&tags=${qtag}&pageNumber=${pageNumber}&pageSize=${pageSize}`
                return encodeURI(qstr)
            },
        }),

        getUploadedVideos: build.query<SearchMyUploadedVideosResponse, void>({
            query: () => '/videos/my-videos'
        }),

        getTags: build.query<Tag[], void>({
            query: () => "/tags",
        }),

        getLikes: build.query<GetLikeResp, GetLike>({
            query: ({ accountId, videoId }) => `/likes?accountId=${accountId}&videoId=${videoId}`,
            providesTags: ['likes']
        }),

        getSaves: build.query<GetSaveResp, GetSave>({
            query: ({ accountId, videoId }) => `/saves?accountId=${accountId}&videoId=${videoId}`,
            providesTags: ['saves'],
        }),

        getComments: build.query<CommentInfo[], number>({
            query: (videoId: number) => `/comments?videoId=${videoId}`,
            providesTags: ['comments'],
        }),

        postLike: build.mutation<void, PostLike>({
            query: postlike => ({
                url: '/likes',
                method: 'post',
                body: postlike
            }),
            invalidatesTags: ['likes']
        }),

        postSave: build.mutation<void, PostSave>({
            query: postSave => ({
                url: '/saves',
                method: 'post',
                body: postSave
            }),
            invalidatesTags: ['saves']
        }),

        postComment: build.mutation<void, PostComment>({
            query: postComment => ({
                url: '/comments',
                method: 'post',
                body: postComment
            }),
            invalidatesTags: ['comments']
        }),
    })
})

export const {
    useLazyGetVideosQuery, useGetVideosQuery, useGetUploadedVideosQuery, useGetTagsQuery, useGetLikesQuery, useGetSavesQuery,
    usePostLikeMutation, usePostSaveMutation, useGetCommentsQuery, usePostCommentMutation
} = searchApiSlice