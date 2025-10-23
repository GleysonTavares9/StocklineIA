'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Settings, Music2 } from "lucide-react"
import Link from "next/link"

type ProfileTabsProps = {
  user: any
  profile: any
  songs: any[] | null
}

export function ProfileTabs({ user, profile, songs }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="songs" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="songs">
          <Music2 className="w-4 h-4 mr-2" />
          Músicas
        </TabsTrigger>
        <TabsTrigger value="plans">
          <CreditCard className="w-4 h-4 mr-2" />
          Planos
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </TabsTrigger>
      </TabsList>

      <TabsContent value="songs" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Suas Músicas</CardTitle>
          </CardHeader>
          <CardContent>
            {songs?.length ? (
              <div className="space-y-3">
                {songs.map((song) => (
                  <div key={song.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <h3 className="font-medium">{song.title || "Sem título"}</h3>
                    <p className="text-sm text-gray-500">{song.style}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Você ainda não criou nenhuma música</p>
                <Button asChild>
                  <Link href="/">Criar primeira música</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="plans">
        <Card>
          <CardHeader>
            <CardTitle>Seu Plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium">Plano Atual</h3>
              <p className="text-2xl font-bold text-[#338d97]">
                {profile?.subscription_plan || 'Grátis'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {profile?.subscription_status === 'active' 
                  ? `Válido até ${new Date(profile?.subscription_end).toLocaleDateString()}`
                  : 'Atualize seu plano para obter mais recursos'}
              </p>
            </div>
            <Button className="w-full" asChild>
              <Link href="/plans">Ver Planos</Link>
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>Configurações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Informações Pessoais</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p><span className="font-medium">Nome:</span> {user.user_metadata?.full_name || 'Não informado'}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/settings">Gerenciar Conta</Link>
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
