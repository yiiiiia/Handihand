import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

const defaultFont = Open_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HandiHand",
  description: "Discover the handicrafts you like",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={defaultFont.className}>{children}</body>
    </html>
  );
}
