import { Session } from "@/lib/session";
import { createAppSlice } from "@/lib/util";
import { PayloadAction } from "@reduxjs/toolkit";

export interface SessionSliceState {
    session: Session | null
}

const initialState: SessionSliceState = {
    session: null,
};

export const sessionSlice = createAppSlice({
    name: 'session',
    initialState,
    reducers: (create) => ({
        setSession: create.reducer((state, action: PayloadAction<Session>) => {
            state.session = action.payload
        })
    }),
    selectors: {
        selectSession: state => state.session,
    }
})

export const { setSession } = sessionSlice.actions

export const { selectSession } = sessionSlice.selectors