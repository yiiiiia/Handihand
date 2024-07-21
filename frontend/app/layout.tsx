import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "reflect-metadata";
import "./globals.css";
import { StoreProvider } from "./StoreProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Handihand",
  description: "Handicrafts lovers place",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <StoreProvider>
      <html lang="en">
        <body className={inter.className}>
          <main>{children}</main>
        </body>
      </html>
    </StoreProvider>
  );
}
