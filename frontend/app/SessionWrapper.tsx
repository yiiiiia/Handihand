'use client'

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

export default function SessionWrapper({ session, children }: Readonly<{ session: Session | null, children: React.ReactNode }>) {
    return (
        <SessionProvider session={session}>
            {children}
        </SessionProvider>
    )
}