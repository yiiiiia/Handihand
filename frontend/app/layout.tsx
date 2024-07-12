import type { Metadata } from "next";
import { Inter, Open_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const openSans = Open_Sans({ subsets: ["latin"] })

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
      <body className={openSans.className}>{children}</body>
    </html>
  );
}
