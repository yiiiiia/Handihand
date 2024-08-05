'use client'

import { Country, Nullable } from "@/lib/db/entities";
import { createContext } from "react";

export const CountryContext = createContext<Nullable<Country[]>>(null)

export default function CountryProvider({ countries, children }: { countries: Nullable<Country[]>, children: React.ReactNode }) {
    return (
        <CountryContext.Provider value={countries}>
            {children}
        </CountryContext.Provider>
    )
}