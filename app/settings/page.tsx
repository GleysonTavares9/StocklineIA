'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter,
  Button,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui'
import { useToast } from '@/hooks/use-toast'

type UserProfile = {
  id: string
  email: string
  full_name: string
  avatar_url?: string
}

type Subscription = {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  plan_name: string
  current_period_end: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setUser({
          id: user.id,
          email: user.email || '',
          full_name: profile?.full_name || '',
          avatar_url: profile?.avatar_url
        })

        setFormData(prev => ({
          ...prev,
          full_name: profile?.full_name || '',
          email: user.email || ''
        }))

        // Fetch subscription data if available
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (subscription) {
          setSubscription(subscription)
        }

      } catch (error) {
        console.error('Error fetching user data:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do usuário.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, supabase, toast])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: formData.full_name })
        .eq('id', user?.id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso!',
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Senha atualizada com sucesso!',
      })

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    } catch (error) {
      console.error('Error updating password:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a senha. Verifique sua senha atual e tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleBillingPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-create-portal', {
        body: { returnUrl: window.location.origin + '/settings' }
      })

      if (error) throw error
      window.location.href = data.url
    } catch (error) {
      console.error('Error creating billing portal:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível acessar o portal de cobrança.',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#338d97]"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações da sua conta</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 max-w-md">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="password">Senha</TabsTrigger>
          <TabsTrigger value="billing">Assinatura</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Atualize as informações do seu perfil
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileUpdate}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome completo</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Alterar senha</CardTitle>
              <CardDescription>
                Atualize sua senha aqui
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordUpdate}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirme a nova senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Atualizando...' : 'Atualizar senha'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Assinatura</CardTitle>
              <CardDescription>
                Gerencie sua assinatura e pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Plano Atual</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.plan_name}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {subscription.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  {subscription.status === 'active' && (
                    <div className="pt-4">
                      <p className="text-sm text-muted-foreground">
                        Próxima cobrança: {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleBillingPortal}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    Gerenciar assinatura
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p>Você não possui uma assinatura ativa.</p>
                  <Button 
                    onClick={() => router.push('/pricing')}
                    className="w-full"
                  >
                    Ver planos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}