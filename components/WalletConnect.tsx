'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useReadContract } from 'wagmi';
import { injected, metaMask } from 'wagmi/connectors';
import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown, Copy } from 'lucide-react';
import { formatUnits } from 'viem';

const TALLY_CONTRACT_ADDRESS = '0xC2B75dE530CDd44321D51E0842A21a76dD4C6B07' as const;
const REQUIRED_TALLY_BALANCE = 5_000_000;

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

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

  // TALLY token balance check
  const { data: decimals } = useReadContract({
    address: TALLY_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: isConnected },
  });

  const { data: balance, isLoading: tallyLoading } = useReadContract({
    address: TALLY_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const hasEnoughTokens = () => {
    if (!balance || !decimals || !isConnected) return false;
    const balanceInTokens = parseFloat(formatUnits(balance, decimals));
    return balanceInTokens >= REQUIRED_TALLY_BALANCE;
  };

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

  const formatTallyBalance = () => {
    if (tallyLoading) return 'Loading...';
    return hasEnoughTokens() ? '5M+ TALLY' : '< 5M TALLY';
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
                {formatTallyBalance()}
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