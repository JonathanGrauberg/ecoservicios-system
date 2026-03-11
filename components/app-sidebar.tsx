'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import Image from "next/image"
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Leaf,
  Layers,
  UserRoundCog,
  Handshake,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    tooltip: 'Vista general del sistema',
  },
  {
    name: 'Clientes',
    href: '/clients',
    icon: Users,
    tooltip: 'Gestionar clientes',
  },
  {
    name: 'Productos y Servicios',
    href: '/products',
    icon: Package,
    tooltip: 'Lista de precios y servicios',
  },
  {
    name: 'Presupuestos',
    href: '/budgets',
    icon: FileText,
    tooltip: 'Crear y gestionar cotizaciones',
  },
  {
    name: 'Vendedores',
    href: '/sellers',
    icon: Handshake,
    tooltip: 'Crear y gestionar vendedores',
  },
  {
    name: 'Stock',
    href: '/stock',
    icon: Layers,
    tooltip: 'Crear y gestionar stock',
  },
  {
    name: 'Instaladores',
    href: '/installers',
    icon: UserRoundCog,
    tooltip: 'Crear y gestionar instaladores',
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Image
              src="/e-de-eco.png"
              alt="Ecoservicios"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>

          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Ecoservicios</h1>
            <p className="text-xs text-sidebar-foreground/60">Sistema de Gestión</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            
            return (
              <Tooltip key={item.name} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-foreground text-background">
                  {item.tooltip}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/50">
            v1.0.0 - Prototipo
          </p>
        </div>
      </aside>
    </TooltipProvider>
  )
}
