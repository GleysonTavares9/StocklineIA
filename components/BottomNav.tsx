"use client"

import { Home, Music, Mic, ImageIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

const navItems = [
  {
    name: "Featured",
    path: "/featured",
    icon: Home,
  },
  {
    name: "AI Music",
    path: "/",
    icon: Music,
  },
  {
    name: "AI Cover",
    path: "/ai-cover",
    icon: Mic,
  },
  {
    name: "Library",
    path: "/library",
    icon: ImageIcon,
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 flex items-center justify-around px-4 py-3 z-50">
      {navItems.map((item) => (
        <Link
          href={item.path}
          key={item.name}
          className={`flex flex-col items-center gap-1 ${
            pathname === item.path ? "text-[#00ff00]" : "text-zinc-400"
          }`}
        >
          <item.icon className="w-6 h-6" />
          <span className="text-xs font-medium">{item.name}</span>
        </Link>
      ))}
    </nav>
  )
}
