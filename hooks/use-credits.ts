import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/supabase/client'
import { CREDITS_PER_ACTION, CREDIT_CONFIG } from '@/lib/config/plans'
import { toast } from 'sonner'

type CreditBalance = {
  credits_balance: number
  credits_expire_at: string | null
  plan_id: string
  updated_at: string
}

export function useCredits() {
  const [balance, setBalance] = useState<CreditBalance>({ 
    credits_balance: 0, 
    credits_expire_at: null,
    plan_id: 'plan_basico',
    updated_at: new Date().toISOString()
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const user = useUser()
  const supabase = createClient()

  const handleRealtimeUpdate = useCallback(async (payload: { new: { [key: string]: any } }) => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('credits_balance, credits_expire_at, plan_id, updated_at')
        .eq('id', user.id)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        setBalance({
          credits_balance: data.credits_balance || 0,
          credits_expire_at: data.credits_expire_at,
          plan_id: data.plan_id || 'plan_basico',
          updated_at: data.updated_at || new Date().toISOString()
        })
      }
    } catch (err) {
      console.error('Erro ao buscar créditos:', err)
      setError(err as Error)
      toast.error('Erro ao carregar saldo de créditos')
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  const fetchCredits = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('credits_balance, credits_expire_at, plan_id, updated_at')
        .eq('id', user.id)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        setBalance({
          credits_balance: data.credits_balance || 0,
          credits_expire_at: data.credits_expire_at,
          plan_id: data.plan_id || 'plan_basico',
          updated_at: data.updated_at || new Date().toISOString()
        })
      }
    } catch (err) {
      console.error('Erro ao buscar créditos:', err)
      setError(err as Error)
      toast.error('Erro ao carregar saldo de créditos')
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  const deductCredits = async (action: keyof typeof CREDITS_PER_ACTION, referenceId?: string) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    const creditsToDeduct = CREDITS_PER_ACTION[action]
    
    try {
      // Usa a função RPC para deduzir créditos
      const { data, error: deductError } = await supabase.rpc('deduct_user_credits', {
        p_user_id: user.id,
        p_amount: creditsToDeduct,
        p_action_type: action,
        p_reference_id: referenceId || null,
        p_description: `Uso de créditos para ${action}`
      })

      if (deductError) throw deductError

      // Atualiza o saldo local com os dados retornados
      if (data) {
        setBalance({
          credits_balance: data.credits_balance || 0,
          credits_expire_at: data.credits_expire_at,
          plan_id: data.plan_id || 'plan_basico',
          updated_at: data.updated_at || new Date().toISOString()
        })
      }

      return true
    } catch (err) {
      console.error('Erro ao deduzir créditos:', err)
      toast.error('Erro ao processar a transação')
      throw err
    }
  }

  const addCredits = async (
    credits: number, 
    type: 'purchase' | 'bonus' | 'refund' | 'referral' = 'purchase',
    referenceId?: string,
    description?: string,
    expiresInDays?: number
  ) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    try {
      // Usa a função RPC para adicionar créditos
      const { data, error: addError } = await supabase.rpc('add_user_credits', {
        p_user_id: user.id,
        p_amount: credits,
        p_type: type,
        p_reference_id: referenceId || null,
        p_description: description || `Adição de ${credits} créditos`,
        p_expires_in_days: expiresInDays || null
      })

      if (addError) throw addError

      // Atualiza o estado local com os dados retornados
      if (data) {
        setBalance({
          credits_balance: data.credits_balance || 0,
          credits_expire_at: data.credits_expire_at,
          plan_id: data.plan_id || 'plan_basico',
          updated_at: data.updated_at || new Date().toISOString()
        })
      }

      return data?.credits_balance || 0
    } catch (err) {
      console.error('Erro ao adicionar créditos:', err)
      toast.error('Erro ao processar a adição de créditos')
      throw err
    }
  }

  // Efeito para carregar os créditos iniciais
  useEffect(() => {
    if (user) {
      fetchCredits()
      
      // Configura um listener para atualizações em tempo real
      const subscription = supabase
        .channel(`user_credits_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            const newData = payload.new as CreditBalance
            setBalance({
              credits_balance: newData.credits_balance || 0,
              credits_expire_at: newData.credits_expire_at,
              plan_id: newData.plan_id || 'plan_basico',
              updated_at: newData.updated_at || new Date().toISOString()
            })
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user, fetchCredits])

  // Função para verificar se o usuário tem créditos suficientes
  const hasEnoughCredits = useCallback((action: keyof typeof CREDITS_PER_ACTION) => {
    return (balance.credits_balance || 0) >= CREDITS_PER_ACTION[action]
  }, [balance.credits_balance])

  // Função para formatar a data de expiração
  const formatExpirationDate = useCallback(() => {
    if (!balance.credits_expire_at) return 'Sem data de expiração'
    return new Date(balance.credits_expire_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }, [balance.credits_expire_at])

  return {
    balance: {
      available: balance.credits_balance || 0,
      used: 0, // Não temos essa informação direta, pode ser calculada se necessário
      total: balance.credits_balance || 0, // Assumindo que o saldo atual é o total
      expires_at: balance.credits_expire_at,
      plan_id: balance.plan_id,
      last_updated: balance.updated_at
    },
    isLoading,
    error,
    deductCredits,
    addCredits,
    hasEnoughCredits,
    formatExpirationDate,
    refresh: fetchCredits
  }
}

// Hook para verificar se o usuário tem créditos suficientes
// sem precisar carregar todos os detalhes do saldo
export function useHasEnoughCredits(action: keyof typeof CREDITS_PER_ACTION) {
  const [hasEnough, setHasEnough] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const user = useUser()
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const checkCredits = async () => {
      try {
        // Usa a função RPC para obter o saldo de créditos
        const { data, error } = await supabase.rpc('get_user_credit_balance', {
          p_user_id: user.id
        })

        if (error) throw error

        // Verifica se o usuário tem créditos suficientes para a ação
        setHasEnough((data?.credits_balance || 0) >= CREDITS_PER_ACTION[action])
      } catch (err) {
        console.error('Erro ao verificar créditos:', err)
        setHasEnough(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkCredits()
  }, [user, action, supabase])

  return { hasEnough, isLoading }
}
