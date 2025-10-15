'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from "@/lib/utils"

interface Plan {
  id: string
  name: string
  price: number
  credits: number
  price_id: string
}

interface PlansClientProps {
  user: User
  plans: Plan[]
  subscription: { plan_id: string; status: string } | null
}

const planFeatures: { [key: string]: string[] } = {
    Básico: [
        '10 credits per month',
        'Access to standard music models',
        'Standard generation speed',
        'Email support',
    ],
    Pro: [
        '100 credits per month',
        'Access to all music styles',
        'Priority generation queue',
        'Priority email support',
    ],
    Premium: [
        '500 credits per month',
        'Access to all music styles',
        'Highest priority queue',
        '24/7 dedicated support',
        'Early access to new features',
    ],
};

export default function PlansClient({ user, plans, subscription }: PlansClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  const handleSubscribe = async (price_id: string) => {
    setLoadingPlanId(price_id)
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price_id }),
      })

      const { url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      if (url) {
        window.location.href = url
      } else {
        throw new Error('Could not get subscription link.')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
      setLoadingPlanId(null)
    }
  }

  const handleManageSubscription = async () => {
    setLoadingPlanId('portal');
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Could not get management link.');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-primary">Pricing Plans</h1>
            <p className="mt-3 text-xl text-muted-foreground sm:mt-4">
            Choose the plan that fits your needs. Unlock more credits and generate endless music.
            </p>
            {subscription && (
                <div className="mt-8">
                <Button
                    onClick={handleManageSubscription}
                    disabled={loadingPlanId === 'portal'}
                >
                    {loadingPlanId === 'portal' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Manage Subscription
                </Button>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const isHighlighted = index === 1;
            const features = planFeatures[plan.name] || [];
            return (
                <Card 
                    key={plan.id} 
                    className={cn(
                        "relative flex flex-col transform transition-all duration-300 hover:scale-105",
                        {
                            "border-2 border-primary shadow-2xl": isHighlighted,
                            "border border-border": !isHighlighted
                        }
                    )}
                >
                    {isHighlighted && (
                        <div className="absolute top-0 right-4 -mt-3">
                            <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                                Most Popular
                            </div>
                        </div>
                    )}
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-semibold">{plan.name}</CardTitle>
                        <CardDescription>{plan.credits} credits / month</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
                        <div className="mb-6">
                            <span className="text-5xl font-extrabold">${plan.price}</span>
                            <span className="text-xl text-muted-foreground">/mo</span>
                        </div>
                        <ul className="space-y-3 text-muted-foreground text-sm text-left">
                            {features.map((feature, i) => (
                                <li key={i} className="flex items-center">
                                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter className="mt-6">
                        {subscription?.plan_id === plan.id ? (
                        <Button disabled className="w-full">Current Plan</Button>
                        ) : (
                        <Button
                            onClick={() => handleSubscribe(plan.price_id)}
                            disabled={loadingPlanId === plan.price_id}
                            className={cn("w-full")}
                            variant={isHighlighted ? 'default' : 'outline'}
                        >
                            {loadingPlanId === plan.price_id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Subscribe
                        </Button>
                        )}
                    </CardFooter>
                </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
