'use client'

import { Header } from './header'
import { Sidebar } from './sidebar'
import { MobileNav } from './mobile-nav'
import { type ReactNode } from 'react'

interface MainLayoutProps {
  children: ReactNode
  showSidebar?: boolean
  showHeader?: boolean
}

export function MainLayout({ children, showSidebar = true, showHeader = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <Header />}
      {showSidebar && <Sidebar showHeader={showHeader} />}
      <main
        className={`min-h-screen pb-20 ${showHeader ? 'pt-24' : 'pt-6'} ${showSidebar ? 'lg:ml-64' : ''} px-6`}
      >
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
      <MobileNav />
    </div>
  )
}
