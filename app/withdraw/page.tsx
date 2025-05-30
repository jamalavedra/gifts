"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from "sonner";
import { motion } from 'framer-motion';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACTS } from '@/lib/contracts/config';

export default function WithdrawPage() {
  const [address, setAddress] = useState('');

  const { writeContract, isPending, data } = useWriteContract();
  const { address:walletAddress } = useAccount();

  const { data: balance } = useReadContract({
    address: CONTRACTS.USDC.address,
    functionName: "balanceOf",
    abi: CONTRACTS.USDC.abi,
    args: [walletAddress!],
    query: { refetchInterval: 1000 }
  })

  const handleWithdraw = async () => {
    if (!address) {
      toast.error('Please enter a withdrawal address');
      return;
    }
    toast.message('Withdrawal initiated');
    writeContract({
      abi: CONTRACTS.USDC.abi,
      address: CONTRACTS.USDC.address,
      functionName: "transfer",
      args: [address as `0x${string}`, balance!], 
    })
    toast.success(data ? `Withdrawal successful: ${data}` : 'Withdrawal failed');
  };

  return (
    <main className="min-h-screen p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <Card className="glass-card border-none p-8 space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-inter text-emerald-500">Withdraw USDC</h1>
            <div className="w-10" />
          </div>

          <div className="text-center space-y-2">
            <div className="text-4xl font-inter">{`$ ${balance ? formatUnits(balance as bigint, 6):0}`}</div>
          <div className="text-sm font-inter text-white/60">Available Balance</div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-inter">USDC Address (SEPOLIA ANCIENT8)</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your USDC address"
                className="glass-button border-white/20 text-white font-inter placeholder:text-white/40"
              />
            </div>

            <Button 
              className="w-full glass-button hover:bg-white/20 text-white py-6 font-inter disabled:opacity-50"
              onClick={handleWithdraw}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Withdraw'
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </main>
  );
}