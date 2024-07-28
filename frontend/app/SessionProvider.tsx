'use client'

import { Session } from "@/lib/db/entities";
import { createContext } from "react";

export const SessionContext = createContext<Session | null>(null)

export default function SessionProvider({ session, children }: { session: Session | null, children: React.ReactNode }) {
    return (
        <SessionContext.Provider value={session}>
            {children}
        </SessionContext.Provider>
    )
}