import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "世界杯竞猜",
  description: "和朋友一起竞猜世界杯，看谁猜得最准！",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-zinc-950 text-white antialiased">{children}</body>
    </html>
  );
}
