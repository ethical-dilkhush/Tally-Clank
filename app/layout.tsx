import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "@/components/providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Tally Clank",
  description: "Track cryptocurrency tokens in real-time",
  generator: "v0.dev",
  icons: {
    icon: "/favicon.webp",
    apple: "/favicon.webp",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-background to-background/80 bg-fixed">
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <div className="relative">
              {/* Background decorative elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
              </div>

              {/* Main content */}
              <div className="relative z-10">{children}</div>
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
