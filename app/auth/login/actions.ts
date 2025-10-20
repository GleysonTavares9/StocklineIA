'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirectTo') as string) || '/'
  
  // Validar entrada
  if (!email || !password) {
    return redirect('/auth/login?message=Email e senha são obrigatórios')
  }

  const supabase = createClient()

  try {
    // Tentar fazer login
    console.log('Tentando fazer login para:', email)
    const { error, data } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })

    if (error) {
      console.error('Erro de autenticação:', error.message)
      return redirect('/auth/login?message=Email+ou+senha+inválidos')
    }

    if (!data.session) {
      console.error('Sessão não criada após login')
      return redirect('/auth/login?message=Não+foi+possível+criar+uma+sessão')
    }

    console.log('Login bem-sucedido para:', email)
    
    // Redirecionar para a página inicial ou para a URL de redirecionamento
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    // Garantir que o redirectTo seja uma URL relativa válida
    let safeRedirectTo = redirectTo.startsWith('/') ? redirectTo : '/' + redirectTo
    if (!safeRedirectTo.startsWith('/')) {
      safeRedirectTo = '/' + safeRedirectTo
    }
    
    const redirectUrl = new URL(safeRedirectTo, baseUrl).toString()
    console.log('Redirecionando para:', redirectUrl)
    
    // Usar o replace: true para evitar problemas de histórico
    redirect(redirectUrl)
    
  } catch (error: any) {
    console.error('Erro inesperado durante o login:', error)
    return redirect('/auth/login?message=Ocorreu+um+erro+inesperado.+Tente+novamente.')
  }
}
