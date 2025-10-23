'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CreditsBalance } from "@/components/credits-balance"
import { Button } from "@/components/ui/button"
import { CancelSubscriptionButton } from "@/components/ui/cancel-subscription-button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Zap, Clock, CheckCircle, XCircle, AlertTriangle, Gift, Loader2, CreditCard } from "lucide-react"
import { AddCardDialog } from "@/components/stripe/add-card-dialog"

type Transaction = {
  id: string
  amount: number
  type: string
  description: string | null
  reference_id: string | null
  created_at: string
  expires_at: string | null
  status: 'completed' | 'pending' | 'failed'
}

type CreditBalance = {
  available: number
  used: number
  total: number
  expires_at: string | null
}

type PaymentMethod = {
  id: string
  card_brand: string
  card_last4: string
  card_exp_month: number
  card_exp_year: number
  is_default: boolean
}

type BillingData = {
  subscription: any | null
  creditBalance: CreditBalance
  transactions: Transaction[]
  paymentMethods: PaymentMethod[]
}

export function BillingClient() {
  const [data, setData] = useState<BillingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('credits')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        console.log('Fetching user session...')
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Error getting user:', userError)
          throw userError
        }
        
        if (!user) {
          console.log('No user found, redirecting to login...')
          router.push('/auth/login')
          return
        }
        
        console.log('User found, fetching billing data...', { userId: user.id })

        // Fetch subscription, profile and transactions in parallel
        console.log('Fetching data from Supabase...')
        console.log('Iniciando busca de dados do usuário...');
        
        const [
          { data: subscription, error: subscriptionError },
          { data: profileData, error: profileError },
          { data: transactions, error: transactionsError },
          paymentMethodsResponse
        ] = await Promise.all([
          supabase
            .from("subscriptions")
            .select("*, plan_id(*)")
            .eq("user_id", user.id)
            .in("status", ["trialing", "active"])
            .maybeSingle()
            .then(({ data, error }) => {
              console.log('Subscription data:', data);
              console.log('Subscription error:', error);
              return { data, error };
            }),
          
          // Buscando todos os campos do perfil para garantir que não estamos perdendo nada
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
            .then(({ data, error }) => {
              console.log('Profile data from billing:', data);
              console.log('Profile error from billing:', error);
              
              if (!data) {
                return { data: null, error: new Error('Perfil não encontrado') };
              }
              
              // Usar o campo credits para manter consistência com o header
              // Se credits_balance existir, mantemos ele, mas usamos credits como valor principal
              return { 
                data: { 
                  ...data,
                  // Garantir que credits sempre tenha um valor
                  credits: data.credits || 0,
                  // Manter o credits_balance se existir, senão usar credits
                  credits_balance: data.credits_balance ?? data.credits ?? 0
                }, 
                error 
              };
            }),
          
          supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          
          // Buscar métodos de pagamento da API
          fetch('/api/payment-methods').then(res => res.json())
        ])
        
        const paymentMethods = paymentMethodsResponse.paymentMethods || [];
        const paymentMethodsError = paymentMethodsResponse.error ? new Error(paymentMethodsResponse.error) : null;

        // Log any errors from the queries
        if (subscriptionError) console.error('Subscription error:', subscriptionError);
        if (profileError) console.error('Profile error:', profileError);
        if (transactionsError) console.error('Transactions error:', transactionsError);
        if (paymentMethodsError) console.error('Payment methods error:', paymentMethodsError);
        
        // Debug: Verificar se o perfil tem stripe_customer_id
        console.log('Dados do perfil:', {
          hasProfile: !!profileData,
          stripeCustomerId: profileData?.stripe_customer_id,
          hasPaymentMethods: paymentMethodsResponse?.paymentMethods?.length > 0
        });
        
        console.log('Data fetched successfully:', {
          hasSubscription: !!subscription,
          hasProfile: !!profileData,
          profileData: profileData, // Log detalhado do perfil
          profileKeys: profileData ? Object.keys(profileData) : [], // Mostra todas as chaves do perfil
          profileCredits: profileData?.credits, // Valor exato de credits
          transactionsCount: transactions?.length || 0,
          paymentMethodsCount: paymentMethods?.length || 0
        })

        // Usar o mesmo valor de créditos do header
        const credits = profileData?.credits || 0;
        const creditsBalance = profileData?.credits_balance ?? credits;
        
        setData({
          subscription,
          creditBalance: {
            available: creditsBalance,
            used: Math.max(0, credits - creditsBalance), // Garantir que não seja negativo
            total: credits,
            expires_at: profileData?.credits_expire_at
          },
          transactions: transactions || [],
          paymentMethods: paymentMethods || []
        })
      } catch (error) {
        console.error('Error fetching billing data:', error)
        // Show error in UI
        setData({
          subscription: null,
          creditBalance: {
            available: 0,
            used: 0,
            total: 0,
            expires_at: null
          },
          transactions: [],
          paymentMethods: []
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBillingData()
  }, [router, supabase])

  // Logs para depuração
  console.log('=== DADOS DE DEPURAÇÃO ===');
  console.log('Dados completos:', data);
  console.log('Tem assinatura?', !!data?.subscription);
  console.log('Dados da assinatura:', data?.subscription);
  console.log('Status da aba ativa:', activeTab);
  
  if (data?.subscription) {
    console.log('Status da assinatura:', data.subscription.status);
    console.log('Tipo da assinatura:', typeof data.subscription);
    console.log('Plano da assinatura:', data.subscription.plan_id);
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#338d97] mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Carregando informações de faturamento...</h2>
          <p className="text-gray-500 mt-2">Isso pode levar alguns segundos</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erro ao carregar os dados</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Não foi possível carregar as informações de faturamento. Por favor:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Verifique sua conexão com a internet</li>
                    <li>Certifique-se de que está logado</li>
                    <li>Tente novamente mais tarde</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="bg-white hover:bg-gray-50 border-red-300 text-red-700"
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { subscription, creditBalance, transactions, paymentMethods } = data

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" /> Concluído
        </Badge>
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" /> Pendente
        </Badge>
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" /> Falhou
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Faturamento</h1>
          <p className="text-muted-foreground">Gerencie sua assinatura, créditos e pagamentos</p>
        </div>
      </div>

      <Tabs defaultValue="credits" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
          <TabsTrigger value="credits">Créditos</TabsTrigger>
          <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="credits" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando créditos...</span>
            </div>
          ) : !data ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Não foi possível carregar os dados de créditos.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Saldo de Créditos</CardTitle>
                <CardDescription>Seu saldo atual de créditos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
                      <Zap className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {data.creditBalance.available ?? 0} créditos
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {data.creditBalance.available === 0 ? 'Sem créditos disponíveis' : ''}
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => router.push('/pricing')}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Comprar Créditos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Créditos</CardTitle>
              <CardDescription>Transações recentes de créditos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {transaction.type === 'purchase' ? (
                              <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                            ) : (
                              <Gift className="w-4 h-4 mr-2 text-green-500" />
                            )}
                            {transaction.description || 'Transação de créditos'}
                          </div>
                        </TableCell>
                        <TableCell className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhuma transação encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Plano Atual</CardTitle>
                  <CardDescription>
                    {subscription ? 'Detalhes da sua assinatura ativa' : 'Você não possui uma assinatura ativa'}
                  </CardDescription>
                </div>
                {subscription && (
                  <Button variant="outline" size="sm" onClick={() => {
                    // Handle manage subscription
                    window.open('https://billing.stripe.com', '_blank')
                  }}>
                    Gerenciar Assinatura
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Plano</p>
                      <p className="font-medium">{subscription.plan_id?.name || 'Plano Básico'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={subscription.status === 'active' ? 'default' : 'outline'}>
                        {subscription.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                      <p className="font-medium">
                        {subscription.current_period_end ? (
                          format(new Date(subscription.current_period_end), 'dd/MM/yyyy', { locale: ptBR })
                        ) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-medium">
                        {subscription.plan_id?.amount ? (
                          `R$ ${(subscription.plan_id.amount / 100).toFixed(2).replace('.', ',')}/mês`
                        ) : 'Gratuito'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Botão de cancelamento de assinatura */}
                  <div className="pt-6 mt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium mb-4">Cancelar Assinatura</h3>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <p className="text-red-700 text-sm mb-4">
                        Ao cancelar, você continuará com acesso até o final do período atual.
                      </p>
                      <CancelSubscriptionButton />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma assinatura ativa</h3>
                  <p className="text-muted-foreground mb-6">Assine um plano para desbloquear recursos exclusivos</p>
                  <Button onClick={() => router.push('/pricing')}>
                    Ver Planos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>Gerencie suas formas de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods && paymentMethods.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Final</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Padrão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentMethods.map((method) => (
                      <TableRow key={method.id}>
                        <TableCell className="capitalize">{method.card_brand}</TableCell>
                        <TableCell>•••• {method.card_last4}</TableCell>
                        <TableCell>
                          {method.card_exp_month}/{method.card_exp_year}
                        </TableCell>
                        <TableCell>
                          {method.is_default ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Padrão
                            </Badge>
                          ) : (
                            <Badge variant="outline">Secundário</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              // Handle set as default
                            }}
                            disabled={method.is_default}
                          >
                            Tornar padrão
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Nenhum método de pagamento</h3>
                  <p className="text-muted-foreground mb-6">Adicione um método de pagamento para facilitar suas compras</p>
                  <AddCardDialog />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
