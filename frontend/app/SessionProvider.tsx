'use client'

import { Nullable, Session } from "@/lib/db/entities";
import { createContext } from "react";

export const SessionContext = createContext<Nullable<Session>>(null)

export default function SessionProvider({ session, children }: { session: Nullable<Session>, children: React.ReactNode }) {
    return (
        <SessionContext.Provider value={session}>
            {children}
        </SessionContext.Provider>
    )
}