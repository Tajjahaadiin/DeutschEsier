import React, { useState } from 'react'
import {
  MessageSquare,
  Layers,
  Plus,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react'
import { logoutTeacher } from '../../lib/auth'

export interface DashboardLayoutProps {
  currentPath: string
  navigate: (path: string) => void
  children: React.ReactNode
}

/**
 * Layout dashboard guru standar dengan sidebar desktop tetap dan drawer mobile responsif.
 *
 * Menerapkan prinsip DESIGN.md:
 * - Warna netral slate, aksen tunggal primary blue (tanpa gradient, tanpa indigo/violet).
 * - Transisi halus terfokus (transition-colors, transition-transform, tanpa transition-all).
 * - Radius bertingkat: md (8px) untuk item navigasi, sm (6px) untuk badge.
 * - Hierarki tipografi tegas: display (30px), heading (20px), body (16px), label (12px).
 */
export default function DashboardLayout({
  currentPath,
  navigate,
  children,
}: DashboardLayoutProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const navItems = [
    {
      label: 'Skenario Pembelajaran',
      sublabel: 'Szenarien & Kuis',
      path: '/',
      icon: MessageSquare,
      active: currentPath === '/' || currentPath.startsWith('/view/'),
    },
    {
      label: 'Die Grundlagen',
      sublabel: 'Kosakata, Alfabet, Angka & Hari',
      path: '/grundlagen',
      icon: Layers,
      active: currentPath.startsWith('/grundlagen'),
    },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-surface border-r border-border text-text">
      {/* Brand Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-primary text-on-primary flex items-center justify-center font-bold text-lg shadow-xs">
            DE
          </div>
          <div>
            <h1 className="font-bold text-base text-text leading-tight tracking-tight">
              DeutschEasier
            </h1>
            <p className="text-label text-text-muted">Portal Pendidik</p>
          </div>
        </div>
        {mobileDrawerOpen && (
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-muted transition-colors md:hidden"
            aria-label="Tutup menu navigasi"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Action CTA */}
      <div className="p-3">
        <button
          type="button"
          onClick={() => {
            navigate('/generate')
            setMobileDrawerOpen(false)
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-md bg-primary text-on-primary text-sm font-semibold hover:opacity-95 active:scale-[0.98] transition-transform shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          <span>Buat Skenario AI</span>
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                navigate(item.path)
                setMobileDrawerOpen(false)
              }}
              className={`w-full flex items-start gap-3 p-2.5 rounded-md text-left transition-colors cursor-pointer ${
                item.active
                  ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary pl-2'
                  : 'text-text-muted hover:text-text hover:bg-surface-muted font-medium'
              }`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <span className="block text-sm leading-snug">{item.label}</span>
                <span className="block text-label text-text-muted/80 truncate">
                  {item.sublabel}
                </span>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Footer Area: Teacher Account */}
      <div className="p-3 border-t border-border bg-neutral">
        {/* Teacher Profile & Logout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              <GraduationCap size={14} />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-text truncate">Guru Bahasa</span>
              <span className="block text-[11px] text-text-muted">Akses Penuh</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logoutTeacher()}
            className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
            title="Keluar dari akun guru"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh flex bg-neutral">
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden md:block w-64 shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden animate-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer (Slide In) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 md:hidden transform transition-transform duration-200 ease-out ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Mobile Top App Bar */}
        <header className="md:hidden sticky top-0 z-20 bg-surface border-b border-border px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-muted transition-colors cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              <Menu size={20} />
            </button>
            <span className="font-bold text-base text-text">DeutschEasier</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/generate')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-on-primary text-xs font-semibold shadow-xs"
          >
            <Plus size={14} />
            <span>Buat</span>
          </button>
        </header>

        {/* Child Pages */}
        <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
