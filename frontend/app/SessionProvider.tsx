'use client'

import { Session } from "@/lib/session";
import { createContext } from "react";

export const SessionContext = createContext<Session>(null)

export default function SessionProvider({ session, children }: { session: Session, children: React.ReactNode }) {
    return (
        <SessionContext.Provider value={session}>
            {children}
        </SessionContext.Provider>
    )
}