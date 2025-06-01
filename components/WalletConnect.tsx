'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi';
import { injected, metaMask } from 'wagmi/connectors';
import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown, Copy } from 'lucide-react';

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [base.id]: http('https://developer-access-mainnet.base.org'),
  },
});

export function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address,
  });

  // Ensure component is mounted to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      // Try to use injected (MetaMask, etc.) first
      const injectedConnector = connectors.find(connector => connector.type === 'injected');
      const connector = injectedConnector || connectors[0];
      
      if (connector) {
        await connect({ connector });
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const formatBalance = (balance: any) => {
    if (!balance?.formatted) return '0.0000 ETH';
    
    const value = parseFloat(balance.formatted);
    if (value === 0) return '0.0000 ETH';
    
    // Show more precision for small amounts, less for larger amounts
    if (value < 0.001) {
      return `${value.toFixed(6)} ETH`;
    } else if (value < 1) {
      return `${value.toFixed(4)} ETH`;
    } else {
      return `${value.toFixed(3)} ETH`;
    }
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setIsDropdownOpen(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
  };

  // Show loading state until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1 text-xs sm:text-sm"
        disabled
      >
        <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden xs:inline">Connect Wallet</span>
        <span className="xs:hidden">Connect</span>
      </Button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {!isConnected ? (
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 text-xs sm:text-sm"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </span>
          <span className="xs:hidden">
            {isConnecting ? 'Connecting...' : 'Connect'}
          </span>
        </Button>
      ) : (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-xs sm:text-sm hover:bg-muted/50"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="flex flex-col items-start">
              <div className="text-xs font-medium">
                {formatBalance(balance)}
              </div>
              <div className="text-xs text-muted-foreground">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            </div>
            <ChevronDown className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </Button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-40 bg-card border border-border rounded-md shadow-lg z-50">
              <div className="p-2">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs h-8"
                    onClick={copyAddress}
                  >
                    <Copy className="h-3 w-3 mr-2" />
                    Copy Address
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs h-8 text-destructive hover:text-destructive"
                    onClick={handleDisconnect}
                  >
                    <Wallet className="h-3 w-3 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 