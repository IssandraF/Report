import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import Navbar from "@/components/Navbar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FleetFinance - Laporan Armada",
  description: "Sistem Laporan Pemasukan & Pengeluaran Armada Mobil",
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Navbar />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
