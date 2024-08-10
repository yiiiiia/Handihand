'use client'

import { Country } from "@/lib/db/entities";
import { createContext } from "react";

export const CountryContext = createContext<Country[]>([])

export default function CountryProvider({ countries, children }: { countries: Country[], children: React.ReactNode }) {
    return (
        <CountryContext.Provider value={countries}>
            {children}
        </CountryContext.Provider>
    )
}