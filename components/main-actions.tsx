"use client";

import { Button } from '@/components/ui/button';
import { ShoppingCart, Send, Gift, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useNFTActions } from '@/lib/hooks/useNFTActions';
import { Gift as GiftType } from '@/app/page';
import { formatUnits } from 'viem';

interface MainActionsProps {
  currentGift: GiftType;
  balance: bigint;
}

export function MainActions({ currentGift, balance }: MainActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const { buyGift, redeemGift, isLoading, transactionHash, error } = useNFTActions();
  const [pendingRedemption, setPendingRedemption] = useState(false);
  const redemptionInProgressRef = useRef(false);

  // Reset loading state when transaction is no longer loading
  useEffect(() => {
    if (error) {
      setLoading(null);
    }
  }, [error]);

  // Watch for transaction hash when redeeming
  useEffect(() => {
    const handleRedemption = async () => {
      // Check if redemption is already in progress or conditions aren't met
      if (!pendingRedemption || !transactionHash || redemptionInProgressRef.current) {
        return;
      }
  
      // Set the ref to true to prevent multiple executions
      redemptionInProgressRef.current = true;
  
      try {
        const response = await fetch('/api/redeem', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionHash,
          }),
        });
  
        if (!response.ok) {
          throw new Error('Redemption API call failed');
        }
  
        const data = await response.json();
        
        if (data.success && data.hash) {
          toast.success(`Redeemed successfully! $${currentGift.price} added to your balance`);
        } else {
          throw new Error(data.error || 'Redemption failed');
        }
      } catch (error) {
        console.error('Redemption API error:', error);
        toast.error('Failed to process redemption. Please try again or contact support.');
      } finally {
        setPendingRedemption(false);
        setLoading(null);
        // Reset the ref
        redemptionInProgressRef.current = false;
      }
    };
  
    handleRedemption();
  }, [transactionHash, pendingRedemption, currentGift.price]);

  const handleAction = async (action: string) => {
    if (isLoading || loading) return;
    
    try {
      setLoading(action);

      switch (action) {
        case 'buy': {
          const totalCost = currentGift.price * currentGift.quantity;
          const formattedBalance = formatUnits(balance, 6);
          if (Number(formattedBalance) < totalCost) {
            toast.error(`Insufficient balance. Need $${totalCost} but only have $${formattedBalance}`);
            setLoading(null);
            return;
          }

          const success = await buyGift(currentGift, currentGift.quantity);
          if (success) {
            toast.success(`Purchased ${currentGift.quantity} ${currentGift.name} for $${totalCost}`);
            setLoading(null);
          }
          break;
        }

        case 'send': {
          if (currentGift.owned <= 0) {
            toast.error("You don't own any of this item to send");
            setLoading(null);
            return;
          }

          if (currentGift.owned < currentGift.quantity) {
            toast.error(`You only have ${currentGift.owned} ${currentGift.name} available`);
            setLoading(null);
            return;
          }

          const giftParam = encodeURIComponent(JSON.stringify(currentGift));
          router.push(`/send?asset=${giftParam}`);
          break;
        }

        case 'redeem': {
          if (currentGift.owned <= 0) {
            toast.error("You don't own any of this item to redeem");
            setLoading(null);
            return;
          }

          const success = await redeemGift(currentGift);
          if (success) {
            setPendingRedemption(true);
            // Loading state will be cleared after redemption is processed
          } else {
            setLoading(null);
          }
          break;
        }

        default: {
          setLoading(null);
          break;
        }
      }
    } catch (error) {
      console.error(`Error in ${action} action:`, error);
      toast.error(`Failed to ${action}. Please try again.`);
      setLoading(null);
      setPendingRedemption(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {['buy', 'send', 'redeem'].map((action) => (
          <motion.div
            key={action}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
          >
            <Button 
              variant="secondary" 
              className="glass-button flex flex-col items-center gap-2 h-auto py-4 w-full disabled:opacity-50"
              onClick={() => handleAction(action)}
              disabled={loading !== null || isLoading}
            >
              {loading === action ? (
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              ) : (
                <>
                  {action === 'buy' && <ShoppingCart className="h-5 w-5 text-orange-500" />}
                  {action === 'send' && <Send className="h-5 w-5 text-orange-500" />}
                  {action === 'redeem' && <Gift className="h-5 w-5 text-orange-500" />}
                </>
              )}
              <span className="text-xs font-mono capitalize">{action}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}