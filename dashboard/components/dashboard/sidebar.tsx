'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Key, 
  Settings, 
  Zap,
  HelpCircle,
  ExternalLink
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: Calendar,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'API Keys',
    href: '/dashboard/api-keys',
    icon: Key,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <Zap className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-lg font-bold text-gray-900">
              Gasless infrastructure
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href} onClick={onClose}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive && "bg-indigo-50 text-indigo-700 border-indigo-200"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200 space-y-4">
            {/* Upgrade banner */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Upgrade to Pro</h3>
                <Badge variant="secondary" className="text-xs">
                  50% OFF
                </Badge>
              </div>
              <p className="text-sm opacity-90 mb-3">
                Get unlimited campaigns and advanced analytics
              </p>
              <Button size="sm" variant="secondary" className="w-full">
                Upgrade Now
              </Button>
            </div>

            {/* Help & Support */}
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-gray-600">
                <HelpCircle className="mr-3 h-4 w-4" />
                Help & Support
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-600">
                <ExternalLink className="mr-3 h-4 w-4" />
                API Docs
              </Button>
            </div>

            {/* Version */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Version 2.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}