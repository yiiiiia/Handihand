'use client'

import { Session } from "@/lib/db/entities";
import { createContext, Dispatch, SetStateAction, useState } from "react";

export type SessionCtx = {
    session: Session | null
    setSetssion: Dispatch<SetStateAction<Session | null>>
} | null

export const SessionContext = createContext<SessionCtx>(null)

export default function SessionProvider({ session, children }: { session: Session | null, children: React.ReactNode }) {
    const [value, setValue] = useState(session)
    return (
        <SessionContext.Provider value={{ session: value, setSetssion: setValue }}>
            {children}
        </SessionContext.Provider>
    )
}