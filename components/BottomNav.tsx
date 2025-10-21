"use client"

import { Home, Music, Mic, ImageIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ptBR } from "@/lib/translations"

const navItems = [
  {
    name: ptBR.bottomNav.featured,
    path: "/featured",
    icon: Home,
  },
  {
    name: ptBR.bottomNav.music,
    path: "/",
    icon: Music,
  },
  {
    name: ptBR.bottomNav.covers,
    path: "/ai-cover",
    icon: Mic,
  },
  {
    name: ptBR.bottomNav.library,
    path: "/library",
    icon: ImageIcon,
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const t = ptBR.bottomNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around px-4 py-3 z-50 shadow-lg">
      {navItems.map((item) => {
        const isActive = pathname === item.path
        return (
          <Link
            href={item.path}
            key={item.name}
            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#338d97]' : 'text-gray-500 hover:text-[#338d97]'}`}
            aria-label={item.name}
          >
            <div className={`p-2 rounded-full ${isActive ? 'bg-[#e6f4f7]' : ''}`}>
              <item.icon className={`w-5 h-5 ${isActive ? 'text-[#338d97]' : 'text-gray-500'}`} />
            </div>
            <span className="text-xs font-medium">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
