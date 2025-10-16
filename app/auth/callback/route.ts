import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/"

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Redireciona para a página inicial após o login bem-sucedido
        return NextResponse.redirect(`${origin}${next}`)
      }
      
      console.error('Erro ao trocar código por sessão:', error)
    } catch (error) {
      console.error('Erro no callback de autenticação:', error)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
