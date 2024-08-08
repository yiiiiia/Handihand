import { Video } from "@/lib/db/entities";
import { createAppSlice } from "@/lib/util";
import { PayloadAction } from "@reduxjs/toolkit";

export interface VideoSliceState {
    videos: Video[]
}

const initialState: VideoSliceState = {
    videos: []
};

export const videoSlice = createAppSlice({
    name: 'videos',
    initialState,
    reducers: (create) => ({
        setVideos: create.reducer((state, action: PayloadAction<Video[]>) => {
            state.videos = action.payload
        })
    }),
    selectors: {
        selectVideos: state => state.videos,
    }
})

export const { setVideos } = videoSlice.actions

export const { selectVideos } = videoSlice.selectors
