"use client"
import { Copy, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Image from "next/image"

export default function Footer() {
  const [copied, setCopied] = useState(false)
  const contractAddress = "0xC2B75dE530CDd44321D51E0842A21a76dD4C6B07" // Replace with actual contract address

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <footer className="mt-auto border-t border-card-border bg-card/80 backdrop-blur-md py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and Name */}
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden">
              <Image
                src="/favicon.webp"
                alt="Tally Clank Logo"
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-lg font-bold text-primary">Tally Clank</span>
          </div>

          {/* Contract Address - Reduced width */}
          <div className="flex flex-col items-center">
            <p className="text-sm text-muted-foreground mb-1">Contract Address:</p>
            <div className="flex items-center gap-2 bg-card/60 rounded-md px-3 py-1.5 border border-card-border">
              <span className="text-xs font-mono truncate max-w-[120px] sm:max-w-[180px] md:max-w-[200px]">
                {contractAddress}
              </span>
              <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-6 w-6 hover:bg-primary/10">
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
              <a
                href={`https://basescan.org/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Social Icons - Better aligned */}
          <div className="flex items-center gap-5">
            <a
              href="https://x.com/tally_clank?t=UNJOBp68YvXFzTOibcr8jA&s=09"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-twitter"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
            </a>
            <a
              href="https://t.me/tallyclank"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Telegram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-send"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </a>
            <a
              href="https://warpcast.com/tally-clank"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Warpcast"
            >
              <div className="relative w-5 h-5">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-KWuB6Z9XKqomMAozjRYccBvOZcQTSZ.png"
                  alt="Warpcast"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
            </a>
          </div>
        </div>

        {/* Copyright notice */}
        <div className="mt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tally Clank. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
