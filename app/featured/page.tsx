import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function FeaturedPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Músicas em Destaque</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Placeholder para músicas em destaque */}
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                  <div>
                    <h3 className="font-medium text-gray-900">Música em Destaque {item}</h3>
                    <p className="text-sm text-gray-500">Artista {item}</p>
                    <button className="mt-2 text-sm text-[#338d97] hover:underline">
                      Reproduzir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
