"use client"

import { memo, useState, useCallback } from "react"
import { Star, Globe, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// X (Twitter) icon - simple X shape
function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export interface TokenTableToken {
  id: string
  name: string
  symbol: string
  price: number
  marketCap: number
  volume: number
  change24h: number
  imageUrl: string
  img_url?: string
  cast_hash?: string
  contractAddress?: string
  blockchain?: string
  totalSupply?: number
  circulatingSupply?: number
  description?: string
  website?: string
  explorer?: string
  createdAt?: string | number
  metadata?: {
    socialMediaUrls?: Array<{ platform: "x" | "telegram" | "website"; url: string }>
  } | null
  msg_sender?: string | null
  tags?: { verified?: boolean } | null
  [key: string]: unknown
}

interface TokenTableProps {
  tokens: TokenTableToken[]
  loading?: boolean
  wishlistedTokens?: TokenTableToken[]
  onWishlistToggle?: (token: TokenTableToken) => void
  /** When true, treat marketCap as ETH and multiply by ethPriceUSD (All Tokens tab only). */
  convertMarketCapFromEth?: boolean
  /** ETH price in USD; required when convertMarketCapFromEth is true (e.g. from TokenList). */
  ethPriceUSD?: number | null
}

function formatLargeNumber(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
  return `$${value.toFixed(2)}`
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

/** Read social links strictly from token.metadata.socialMediaUrls (platform + url). */
function getSocialFromMetadata(metadata: TokenTableToken["metadata"]): { platform: "x" | "telegram" | "website"; url: string }[] {
  const urls = metadata?.socialMediaUrls
  if (!urls || !Array.isArray(urls)) return []
  const out: { platform: "x" | "telegram" | "website"; url: string }[] = []
  for (const item of urls) {
    if (!item || typeof item !== "object") continue
    const p = (item as { platform?: string }).platform
    const u = (item as { url?: string }).url
    if (typeof u !== "string" || !u) continue
    if (p === "x" || p === "telegram" || p === "website") out.push({ platform: p, url: u })
  }
  return out
}

function CopyableText({
  value,
  displayText,
  className,
  onClickStop = true,
}: {
  value: string
  displayText: string
  className?: string
  onClickStop?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (onClickStop) e.stopPropagation()
      if (!value) return
      navigator.clipboard.writeText(value).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    },
    [value, onClickStop]
  )
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "font-mono text-sm text-muted-foreground hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-[140px] text-left cursor-pointer",
            className
          )}
        >
          {displayText}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{copied ? "Copied!" : "Click to copy"}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function TokenTableRow({
  token,
  isWishlisted,
  onWishlistToggle,
  ethPriceUSD,
}: {
  token: TokenTableToken
  isWishlisted: boolean
  onWishlistToggle?: (token: TokenTableToken) => void
  /** When undefined: show raw marketCap. When null: loading (show "--"). When number: show marketCap * ethPriceUSD */
  ethPriceUSD?: number | null
}) {
  const [imageError, setImageError] = useState(false)
  const name = token.name || "Unknown Token"
  const symbol = token.symbol || "???"
  const marketCapRaw = typeof token.marketCap === "number" ? token.marketCap : 0
  const marketCapDisplay =
    ethPriceUSD === undefined
      ? formatLargeNumber(marketCapRaw)
      : ethPriceUSD == null
        ? "--"
        : formatLargeNumber(marketCapRaw * ethPriceUSD)
  const volume = typeof token.volume === "number" ? token.volume : 0
  const change24h = typeof token.change24h === "number" ? token.change24h : 0
  const imageUrl = token.img_url || token.imageUrl || ""
  const contractAddress = token.contractAddress || ""
  const creatorAddress = token.msg_sender || ""
  const verified = token.tags?.verified === true
  const socialMediaUrls = token.metadata?.socialMediaUrls
  const hasSocialUrls = Array.isArray(socialMediaUrls) && socialMediaUrls.length > 0
  const socialItems = getSocialFromMetadata(token.metadata)

  const sendToTelegram = (e: React.MouseEvent) => {
    e.stopPropagation()
    const message = `${name} (${symbol})\n\nContract: ${contractAddress}\n24h: ${change24h.toFixed(2)}%`
    const encoded = encodeURIComponent(message)
    const url = `https://t.me/share/url?url=${encodeURIComponent(contractAddress)}&text=${encoded}`
    window.open(url, "_blank")
  }

  const placeholderBg = [
    "from-blue-400 to-blue-600",
    "from-green-400 to-green-600",
    "from-purple-400 to-purple-600",
    "from-slate-400 to-slate-600",
  ][(symbol.charCodeAt(0) || 0) % 4]

  return (
    <tr className="border-b border-card-border/50 transition-colors hover:bg-primary/5">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {onWishlistToggle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onWishlistToggle(token)
              }}
              className="shrink-0 p-1 rounded hover:bg-muted"
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  isWishlisted ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                )}
              />
            </button>
          )}
          <div className="h-8 w-8 rounded-lg overflow-hidden bg-muted shrink-0">
            {imageUrl && !imageError ? (
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                className={cn(
                  "h-full w-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br",
                  placeholderBg
                )}
              >
                {symbol.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-[180px]">
            {name}
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-muted-foreground font-mono text-sm">{symbol}</td>
      <td className="py-3 px-4 text-sm font-medium tabular-nums">{marketCapDisplay}</td>
      <td
        className={cn(
          "py-3 px-4 text-sm font-medium tabular-nums",
          change24h >= 0 ? "text-emerald-500" : "text-red-500"
        )}
      >
        {change24h >= 0 ? "+" : ""}
        {change24h.toFixed(2)}%
      </td>
      <td className="py-3 px-4 text-sm tabular-nums text-muted-foreground">
        {formatLargeNumber(volume)}
      </td>
      {/* Social - boolean when empty, icons when token.metadata.socialMediaUrls.length > 0 */}
      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          {!hasSocialUrls ? (
            <span className="text-muted-foreground text-sm">false</span>
          ) : (
            socialItems.map((link, i) => {
              const href = link.url.startsWith("http") ? link.url : `https://${link.url}`
              const Icon = link.platform === "x" ? XIcon : link.platform === "telegram" ? Send : Globe
              const label = link.platform === "x" ? "X (Twitter)" : link.platform === "telegram" ? "Telegram" : "Website"
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })
          )}
        </div>
      </td>
      {/* Contract Address */}
      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
        {contractAddress ? (
          <CopyableText
            value={contractAddress}
            displayText={truncateAddress(contractAddress)}
          />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </td>
      {/* Creator */}
      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
        {creatorAddress ? (
          <CopyableText
            value={creatorAddress}
            displayText={truncateAddress(creatorAddress)}
          />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </td>
      {/* Verified - token.tags.verified only, boolean display */}
      <td className="py-3 px-4 text-sm text-muted-foreground" onClick={(e) => e.stopPropagation()}>
        {String(verified)}
      </td>
      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs bg-[#0088cc]/10 border-[#0088cc]/30 text-[#0088cc] hover:bg-[#0088cc]/20"
            onClick={sendToTelegram}
          >
            Telegram
          </Button>
        </div>
      </td>
    </tr>
  )
}

const TokenTable = memo(function TokenTable({
  tokens,
  loading = false,
  wishlistedTokens = [],
  onWishlistToggle,
  convertMarketCapFromEth = false,
  ethPriceUSD: ethPriceUSDProp,
}: TokenTableProps) {
  const safeTokens = Array.isArray(tokens) ? tokens : []
  const isWishlisted = (id: string) => wishlistedTokens.some((t) => t.id === id)
  const rowEthPriceUSD = convertMarketCapFromEth ? ethPriceUSDProp : undefined

  const tableHeaderClass =
    "text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
  const colCount = 10 // Token, Symbol, Market Cap, 24h Change, Volume, Social, Contract, Creator, Verified, Actions

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-b border-card-border">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-card-border bg-muted/30">
              <th className={tableHeaderClass}>Token</th>
              <th className={tableHeaderClass}>Symbol</th>
              <th className={tableHeaderClass}>Market Cap</th>
              <th className={tableHeaderClass}>24h Change</th>
              <th className={tableHeaderClass}>Volume (24h)</th>
              <th className={tableHeaderClass}>Social</th>
              <th className={tableHeaderClass}>Contract Address</th>
              <th className={tableHeaderClass}>Creator</th>
              <th className={tableHeaderClass}>Verified</th>
              <th className={tableHeaderClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-card-border/50 animate-pulse">
                {Array.from({ length: colCount }).map((_, j) => (
                  <td key={j} className="py-4 px-4">
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (safeTokens.length === 0) {
    return (
      <div className="w-full border-b border-card-border py-12 text-center">
        <p className="text-muted-foreground">No tokens available</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="w-full overflow-x-auto border-b border-card-border">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-card-border bg-muted/30">
              <th className={tableHeaderClass}>Token</th>
              <th className={tableHeaderClass}>Symbol</th>
              <th className={tableHeaderClass}>Market Cap</th>
              <th className={tableHeaderClass}>24h Change</th>
              <th className={tableHeaderClass}>Volume (24h)</th>
              <th className={tableHeaderClass}>Social</th>
              <th className={tableHeaderClass}>Contract Address</th>
              <th className={tableHeaderClass}>Creator</th>
              <th className={tableHeaderClass}>Verified</th>
              <th className={tableHeaderClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {safeTokens.map((token) => (
              <TokenTableRow
                key={token.id}
                token={token}
                isWishlisted={isWishlisted(token.id as string)}
                onWishlistToggle={onWishlistToggle}
                ethPriceUSD={rowEthPriceUSD}
              />
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  )
})

export default TokenTable
