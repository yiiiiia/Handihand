import { createAppSlice } from "@/lib/createAppSlice";

export interface SearchSliceState {
    searchBy: "video" | "product";
    country: string,
    keyword: string,
}

const initialState: SearchSliceState = {
    searchBy: 'video',
    country: '',
    keyword: '',
};

export const searchSlice = createAppSlice({
    name: 'search',
    initialState,
    reducers: (create) => ({
        toogleSearchBy: create.reducer(state => {
            if (state.searchBy === 'video') {
                state.searchBy = 'product';
            } else {
                state.searchBy = 'video'
            }
        })
    }),
    selectors: {
        selectSearchBy: state => state.searchBy,
        selectCountry: state => state.country,
    }
})

export const { toogleSearchBy } = searchSlice.actions

export const { selectSearchBy, selectCountry } = searchSlice.selectors