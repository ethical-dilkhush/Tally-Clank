'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

// Form validation schema
const tokenFormSchema = z.object({
  name: z.string().min(1, 'Token name is required').max(50, 'Token name too long'),
  symbol: z.string().min(1, 'Token symbol is required').max(10, 'Symbol too long').toUpperCase(),
  description: z.string().optional(),
  socialMediaUrls: z.string().optional(),
});

type TokenFormData = z.infer<typeof tokenFormSchema>;

interface TokenCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TokenCreateModal({ isOpen, onClose }: TokenCreateModalProps) {
  const { address, isConnected } = useAccount();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [deploymentMessage, setDeploymentMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TokenFormData>({
    resolver: zodResolver(tokenFormSchema),
  });

  // Generate unique request key
  const generateRequestKey = (): string => {
    return Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('');
  };

  // Upload image to Pinata
  const uploadImageToPinata = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/pinata/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      
      // Return the gateway URL from our API response
      return data.url;
    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      throw new Error('Failed to upload image to IPFS');
    }
  };

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Deploy token via Clanker API
  const deployToken = async (data: TokenFormData, imageUrl: string) => {
    if (!address) throw new Error('Wallet not connected');

    const requestKey = generateRequestKey();
    
    const socialUrls = data.socialMediaUrls 
      ? data.socialMediaUrls.split('\n').filter(url => url.trim())
      : [];

    const payload = {
      name: data.name,
      symbol: data.symbol,
      image: imageUrl,
      requestorAddress: address,
      requestKey,
      creatorRewardsPercentage: 40, // Default value
      tokenPair: 'WETH',
      description: data.description || '',
      socialMediaUrls: socialUrls,
      platform: 'TallyClank',
      creatorRewardsAdmin: address,
      initialMarketCap: 10,
    };

    const response = await fetch('/api/clanker/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to deploy token');
    }

    return await response.json();
  };

  // Handle form submission
  const onSubmit = async (data: TokenFormData) => {
    if (!isConnected) {
      setDeploymentStatus('error');
      setDeploymentMessage('Please connect your wallet first');
      return;
    }

    if (!imageFile) {
      setDeploymentStatus('error');
      setDeploymentMessage('Please select an image for your token');
      return;
    }

    try {
      setIsUploading(true);
      setDeploymentStatus('idle');

      // Upload image to Pinata
      const imageUrl = await uploadImageToPinata(imageFile);
      
      setIsUploading(false);
      setIsDeploying(true);

      // Deploy token
      const result = await deployToken(data, imageUrl);
      
      setDeploymentStatus('success');
      setDeploymentMessage(`Token "${data.name}" deployed successfully! Contract: ${result.contractAddress || 'Pending...'}`);
      
      // Reset form after successful deployment
      setTimeout(() => {
        reset();
        setImageFile(null);
        setImagePreview(null);
        setDeploymentStatus('idle');
        onClose();
      }, 3000);

    } catch (error) {
      setDeploymentStatus('error');
      setDeploymentMessage(error instanceof Error ? error.message : 'Failed to deploy token');
    } finally {
      setIsUploading(false);
      setIsDeploying(false);
    }
  };

  const handleClose = () => {
    if (!isUploading && !isDeploying) {
      reset();
      setImageFile(null);
      setImagePreview(null);
      setDeploymentStatus('idle');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create Token
            {!isConnected && (
              <span className="text-sm text-destructive">(Wallet not connected)</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pr-2">
            {/* Token Name */}
            <div>
              <Label htmlFor="name">Token Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="My Awesome Token"
                disabled={isUploading || isDeploying}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Token Symbol */}
            <div>
              <Label htmlFor="symbol">Token Symbol *</Label>
              <Input
                id="symbol"
                {...register('symbol')}
                placeholder="MAT"
                disabled={isUploading || isDeploying}
              />
              {errors.symbol && (
                <p className="text-sm text-destructive mt-1">{errors.symbol.message}</p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <Label>Token Image *</Label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Token preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      disabled={isUploading || isDeploying}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500 mt-2">Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={isUploading || isDeploying}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe your token..."
                rows={3}
                disabled={isUploading || isDeploying}
              />
            </div>

            {/* Social Media URLs */}
            <div>
              <Label htmlFor="socialMediaUrls">Social Media URLs (one per line)</Label>
              <Textarea
                id="socialMediaUrls"
                {...register('socialMediaUrls')}
                placeholder="https://twitter.com/mytoken&#10;https://discord.gg/mytoken"
                rows={3}
                disabled={isUploading || isDeploying}
              />
            </div>

            {/* Status Messages */}
            {deploymentStatus !== 'idle' && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                deploymentStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {deploymentStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">{deploymentMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isUploading || isDeploying}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isConnected || isUploading || isDeploying}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading Image...
                  </>
                ) : isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deploying Token...
                  </>
                ) : (
                  'Deploy Token'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 