import { createAppSlice } from "@/lib/createAppSlice";

export interface UploaderSliceState {
    showUploader: boolean
}

const initialState: UploaderSliceState = {
    showUploader: false
};

export const uploaderSlice = createAppSlice({
    name: 'uploader',
    initialState,
    reducers: (create) => ({
        displayUploader: create.reducer(state => {
            if (!state.showUploader) {
                state.showUploader = true
            }
        }),
        hideUploader: create.reducer(state => {
            if (state.showUploader) {
                state.showUploader = false
            }
        })
    }),
    selectors: {
        selectShowUploader: state => state.showUploader,
    }
})

export const { displayUploader, hideUploader } = uploaderSlice.actions

export const { selectShowUploader } = uploaderSlice.selectors