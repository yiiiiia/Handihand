import { getCountries } from "@/lib/db/query";
import { getSession } from "@/lib/session";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import CountryProvider from "./CountryProvider";
import "./globals.css";
import SessionProvider from "./SessionProvider";
import { StoreProvider } from "./StoreProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Handihand",
  description: "Handicrafts lovers place",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession()
  const countries = await getCountries()
  return (
    <StoreProvider>
      <SessionProvider session={session}>
        <CountryProvider countries={countries}>
          <html lang="en">
            <body className={inter.className}>
              <main className="font-sans">{children}</main>
            </body>
          </html>
        </CountryProvider>
      </SessionProvider>
    </StoreProvider>
  );
}
