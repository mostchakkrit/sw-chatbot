import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "SoundWave Pro | หูฟังไร้สาย",
  description: "หูฟังไร้สาย SoundWave Pro พร้อมแชทถามตอบอัตโนมัติ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" data-theme="flip7" className={`${notoSansThai.variable} h-full antialiased`}>
      <body className={`${notoSansThai.className} min-h-full flex flex-col`}>{children}</body>
    </html>
  );
}
