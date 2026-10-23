
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  Menu,
  Package,
  Wrench,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Search,
  Building2,
} from 'lucide-react'

import Dashboard from '@/pages/Dashboard'
import Quotations from '@/pages/Quotations'
import Customers from '@/pages/Customers'
import Reports from '@/pages/Reports'
import AppSettings from '@/pages/Settings'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Quotations', icon: FileText },
  { label: 'Customers', icon: Users },
  { label: 'Products & Inventory', icon: Package },
  { label: 'Service & Maintenance', icon: Wrench },
  { label: 'Orders', icon: ClipboardList },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
]

const quotationCategories = [
  'Outright Sale',
  'Airtime/Frequency',
  'Rental',
  'CAMC',
  'NAMC',
] as const

function AppLayout() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [quotationsOpen, setQuotationsOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    function openCreateQuotation() {
      setActivePage('Quotations')
      setQuotationsOpen(true)
      setMobileMenuOpen(false)
      window.dispatchEvent(new Event('airtech:show-create-tab'))
    }

    window.addEventListener(
      'airtech:create-quotation',
      openCreateQuotation,
    )

    return () => {
      window.removeEventListener(
        'airtech:create-quotation',
        openCreateQuotation,
      )
    }
  }, [])

  function handleNavigation(label: string) {
    setActivePage(label)
    setMobileMenuOpen(false)

    if (label === 'Quotations') {
      setQuotationsOpen((open) => !open)
    }
  }

  function handleQuotationCategory(category: string) {
    setActivePage('Quotations')
    setQuotationsOpen(true)
    setMobileMenuOpen(false)

    window.dispatchEvent(
      new CustomEvent('airtech:select-category', {
        detail: category,
      }),
    )
  }

  function openAllQuotations() {
    setActivePage('Quotations')
    setQuotationsOpen(true)
    setMobileMenuOpen(false)

    window.dispatchEvent(new Event('airtech:show-create-tab'))
  }

  function renderPage() {
    switch (activePage) {
      case 'Quotations':
        return <Quotations />

      case 'Customers':
        return <Customers />

      case 'Products & Inventory':
        return (
          <PlaceholderPage
            title="Products & Inventory"
            description="Manage Airtech products, equipment models, stock and pricing."
          />
        )

      case 'Service & Maintenance':
        return (
          <PlaceholderPage
            title="Service & Maintenance"
            description="Manage service requests, damage reports, repairs and maintenance contracts."
          />
        )

      case 'Orders':
        return (
          <PlaceholderPage
            title="Orders"
            description="Track orders and operational activity as Airtech grows."
          />
        )

      case 'Reports':
        return <Reports />

      case 'Settings':
        return <AppSettings />

      case 'Dashboard':
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#172b4d] md:flex">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-white/10 bg-gradient-to-b from-[#142d4e] to-[#10243f] text-white shadow-xl transition-all duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'w-[76px]' : 'w-[260px]'}`}
      >
        {/* Brand */}
        <div
          className={`flex h-[88px] shrink-0 items-center border-b border-white/10 ${
            sidebarCollapsed ? 'justify-center px-2' : 'px-5'
          }`}
        >
          {!sidebarCollapsed ? (
            <div className="min-w-0">
              <p className="text-[22px] font-extrabold leading-tight tracking-[0.19em] text-white">
                AIRTECH
              </p>
              <div className="mt-2 h-1 w-12 rounded-full bg-blue-400" />
              <p className="mt-1.5 text-[9px] font-semibold tracking-[0.17em] text-blue-200">
                BUSINESS MANAGEMENT
              </p>
            </div>
          ) : (
            <span className="text-xs font-extrabold tracking-wider text-white" title="AIRTECH">
              AT
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden px-3 py-5">
          {!sidebarCollapsed && (
            <p className="mb-4 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Main workspace
            </p>
          )}

          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.label

            if (item.label === 'Quotations') {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    title={sidebarCollapsed ? item.label : undefined}
                    onClick={() => {
                      if (isActive) {
                        setQuotationsOpen((open) => !open)
                      } else {
                        setActivePage('Quotations')
                        setQuotationsOpen(true)
                        setMobileMenuOpen(false)
                        window.dispatchEvent(
                          new Event('airtech:show-create-tab'),
                        )
                      }
                    }}
                    aria-expanded={quotationsOpen}
                    className={`group flex min-h-11 w-full items-center rounded-xl text-sm font-medium transition-colors ${
                      sidebarCollapsed
                        ? 'justify-center px-2'
                        : 'gap-3 px-3'
                    } ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-950/30 ring-1 ring-inset ring-white/10'
                        : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    <Icon size={19} strokeWidth={1.9} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">
                          {item.label}
                        </span>
                        <ChevronDown
                          size={15}
                          className={`transition-transform ${
                            quotationsOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {quotationsOpen && !sidebarCollapsed && (
                    <div className="ml-5 space-y-1 border-l border-blue-300/20 py-2 pl-3">
                      <button
                        type="button"
                        onClick={openAllQuotations}
                        className="flex min-h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold text-blue-100 transition-colors hover:bg-blue-500/15 hover:text-white"
                      >
                        <ChevronRight size={14} />
                        All Quotations
                      </button>

                      {quotationCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() =>
                            handleQuotationCategory(category)
                          }
                          className="min-h-9 w-full rounded-lg px-3 text-left text-xs text-slate-300 transition-colors hover:bg-blue-500/15 hover:text-white"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <button
                key={item.label}
                type="button"
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => handleNavigation(item.label)}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex min-h-11 w-full items-center rounded-xl text-sm font-medium transition-colors ${
                  sidebarCollapsed
                    ? 'justify-center px-2'
                    : 'gap-3 px-3'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-950/30 ring-1 ring-inset ring-white/10'
                    : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <Icon size={19} strokeWidth={1.9} />
                {!sidebarCollapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="shrink-0 border-t border-white/10 bg-black/10 p-3">
          {!sidebarCollapsed ? (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.05] p-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-blue-300" />
                <p className="text-xs font-semibold text-white">
                  Airtech Workspace
                </p>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                Your central workspace for business operations.
              </p>
            </div>
          ) : (
            <div className="flex justify-center py-2" title="Airtech Workspace">
              <Building2 size={19} className="text-blue-300" />
            </div>
          )}

          <button
            type="button"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            className="mt-3 hidden min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/[0.06] text-xs text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white md:flex"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <>
                <PanelLeftClose size={17} />
                <span>Collapse sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main workspace */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:block">
                AIRTECH / WORKSPACE
              </p>
              <h1 className="truncate text-base font-bold text-[#142d4e] sm:mt-0.5 sm:text-lg">
                {activePage}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 lg:flex">
              <Search size={15} />
              <span>Business workspace</span>
            </div>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <button
              type="button"
              aria-label="Notifications"
              title="Notifications"
              onClick={() =>
                window.alert('Notifications are not connected yet.')
              }
              className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#142d4e]"
            >
              <Bell size={19} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-blue-500" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-800 ring-1 ring-blue-200">
                A
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-800">
                  Airtech User
                </p>
                <p className="text-[11px] text-slate-500">
                  Workspace
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-72px)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            {renderPage()}
          </div>
        </main>

        <footer className="border-t border-slate-200/80 bg-white px-6 py-3">
          <p className="text-center text-[11px] text-slate-400">
            AIRTECH Business Management System
          </p>
        </footer>
      </div>
    </div>
  )
}

function PlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          AIRTECH WORKSPACE
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#142d4e] sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Wrench size={25} strokeWidth={1.8} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-[#142d4e]">
          Module planned
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          This module has not been implemented yet. Its functionality will be
          added in a later development step.
        </p>
      </div>
    </div>
  )
}

export default AppLayout
