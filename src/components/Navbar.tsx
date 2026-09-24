"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileBarChart2 } from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/laporan", label: "Laporan", icon: FileBarChart2 },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-md no-print">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <span className="font-bold text-lg tracking-tight">
          Fleet<span className="text-blue-600">Finance</span>
        </span>

        {/* Nav tabs */}
        <div className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
