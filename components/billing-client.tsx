'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BillingClientProps {
  user: User;
  subscription: any;
}

export default function BillingClient({ user, subscription }: BillingClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
      });
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Could not get subscription management link.');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-[#00ff00]">Billing</h1>
        
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Your Subscription</CardTitle>
            <CardDescription className="text-gray-400">Manage your billing and subscription details.</CardDescription>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                  <div>
                    <p className="font-bold text-lg text-white">{subscription.plan_id.name} Plan</p>
                    <p className={`text-sm font-semibold ${subscription.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                      Status: {subscription.status}
                    </p>
                  </div>
                  <ShieldCheck className="w-8 h-8 text-[#00ff00]" />
                </div>
                <Button 
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="w-full bg-[#00ff00] text-black hover:bg-[#00dd00] disabled:opacity-50"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Manage Subscription
                </Button>
              </div>
            ) : (
              <div className="text-center p-8 bg-zinc-800 rounded-lg">
                <p className="text-gray-400 mb-4">You do not have an active subscription.</p>
                <Button onClick={() => router.push('/plans')} className="bg-[#00ff00] text-black hover:bg-[#00dd00]">
                  View Plans
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
