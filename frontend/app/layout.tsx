import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StoreProvider } from "./StoreProvider";
import Nav from "./components/Nav";
import { auth } from "@/lib/auth";
import SessionWrapper from "./SessionWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Handihand",
  description: "Handicrafts lovers place",
};

const session = await auth()
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StoreProvider>
      <SessionWrapper session={session} >
        <html lang="en">
          <body className={inter.className}>
            <section>
              <Nav />
              <main>{children}</main>
            </section>
          </body>
        </html>
      </SessionWrapper>
    </StoreProvider>
  );
}
