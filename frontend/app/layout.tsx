import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"
import "@/lib/api/connection-test"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Smart Package Tracking",
  description: "Real-time package tracking system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

