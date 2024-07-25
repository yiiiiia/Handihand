import { getSession } from "@/lib/session";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
  return (
    <StoreProvider>
      <SessionProvider session={session}>
        <html lang="en">
          <body className={inter.className}>
            <main>{children}</main>
          </body>
        </html>
      </SessionProvider>
    </StoreProvider>
  );
}
