import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"

import "./globals.css"

export const metadata: Metadata = {
  title: "Máy tính tháp bưởi",
  description: "Tính nhanh số lượng bưởi theo cạnh và số tầng, dễ nhìn và dễ sử dụng.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
}

export const viewport: Viewport = {
  themeColor: "#f0f9ff",
  colorScheme: "light",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
