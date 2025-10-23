import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function CoversPage() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      redirect("/auth/login")
    }

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Minhas Capas</h1>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Suas capas de músicas aparecerão aqui.</p>
            
            {/* Placeholder para a lista de capas */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Capa {item}</span>
                </div>
              ))}
            </div>

            {/* Botão para adicionar nova capa */}
            <div className="mt-6">
              <button className="px-4 py-2 bg-[#338d97] text-white rounded-lg hover:bg-[#2a7a83] transition-colors">
                Adicionar Capa
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in CoversPage:', error)
    redirect('/error')
  }
}
