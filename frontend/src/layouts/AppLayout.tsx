
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
  FilePlus2,
  Files,
  ScrollText,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
} from 'lucide-react'

import Dashboard from '@/pages/Dashboard'
import Quotations from '@/pages/Quotations'
import Customers from '@/pages/Customers'
import Reports from '@/pages/Reports'
import AppSettings from '@/pages/Settings'
import TermsTemplates from '@/pages/TermsTemplates'
import ServiceMaintenance from '@/pages/ServiceMaintenance'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Quotations', icon: FileText },
  { label: 'Customers', icon: Users },
  { label: 'Products & Inventory', icon: Package },
  { label: 'Service & Maintenance', icon: Wrench },
  { label: 'Orders', icon: ClipboardList },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Terms & Conditions', icon: ScrollText },
  { label: 'Settings', icon: Settings },
]

const quotationCategories = [
  'Outright Sale',
  'Airtime/Frequency',
  'Rental',
  'CAMC',
  'NAMC',
] as const

const navButtonBase =
  'group flex min-h-11 w-full items-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300'

const navActive =
  'bg-blue-600 text-white shadow-md shadow-blue-950/30 ring-1 ring-inset ring-white/10'

const navIdle =
  'text-slate-300 hover:bg-white/[0.08] hover:text-white'

function AppLayout() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [quotationsOpen, setQuotationsOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [termsView, setTermsView] = useState<'create' | 'saved'>('create')
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

  // Allows dashboard quick-action buttons to open sidebar pages.
  useEffect(() => {
    function handleDashboardNavigation(event: Event) {
      const customEvent = event as CustomEvent<string>
      const page = customEvent.detail
      const allowedPages = navigation.map((item) => item.label)

      if (!allowedPages.includes(page)) {
        return
      }

      setActivePage(page)
      setMobileMenuOpen(false)

      if (page === 'Quotations') {
        setQuotationsOpen(true)
      }

      if (page === 'Terms & Conditions') {
        setTermsOpen(true)
        setTermsView('create')
      }
    }

    window.addEventListener(
      'airtech:navigate',
      handleDashboardNavigation,
    )

    return () => {
      window.removeEventListener(
        'airtech:navigate',
        handleDashboardNavigation,
      )
    }
  }, [])

  function handleNavigation(label: string) {
    setActivePage(label)
    setMobileMenuOpen(false)

    if (label === 'Quotations') {
      setQuotationsOpen((open) => !open)
    }

    if (label === 'Terms & Conditions') {
      setTermsOpen((open) => !open)
      setTermsView('create')
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
        return <ServiceMaintenance />

      case 'Orders':
        return (
          <PlaceholderPage
            title="Orders"
            description="Track orders and operational activity as Airtech grows."
          />
        )

      case 'Reports':
        return <Reports />

      case 'Terms & Conditions':
        return <TermsTemplates initialView={termsView} />

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
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-white/10 bg-[#142d4e] text-white shadow-xl transition-all duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'w-[76px]' : 'w-[260px]'}`}
      >
        <div
          className={`flex h-[72px] shrink-0 items-center border-b border-white/10 ${
            sidebarCollapsed ? 'justify-center px-2' : 'px-5'
          }`}
        >
          {!sidebarCollapsed ? (
            <div className="min-w-0">
              <p className="text-xl font-extrabold leading-tight tracking-[0.19em] text-white">
                AIRTECH
              </p>
              <div className="mt-1.5 h-1 w-10 rounded-full bg-blue-400" />
            </div>
          ) : (
            <span
              className="text-xs font-extrabold tracking-wider text-white"
              title="Airtech"
            >
              AT
            </span>
          )}
        </div>

        <nav
          aria-label="Pages"
          className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4"
        >
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
                    aria-current={isActive ? 'page' : undefined}
                    className={`${navButtonBase} ${
                      sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                    } ${isActive ? navActive : navIdle}`}
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
                    <div className="ml-5 space-y-0.5 border-l border-blue-300/20 py-1.5 pl-3">
                      <button
                        type="button"
                        onClick={openAllQuotations}
                        className="min-h-9 w-full rounded-lg px-3 text-left text-xs font-semibold text-white transition-colors hover:bg-blue-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                      >
                        All quotations
                      </button>

                      {quotationCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => handleQuotationCategory(category)}
                          className="min-h-9 w-full rounded-lg px-3 text-left text-xs text-slate-300 transition-colors hover:bg-blue-500/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            if (item.label === 'Terms & Conditions') {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    title={sidebarCollapsed ? item.label : undefined}
                    onClick={() => {
                      if (isActive) {
                        setTermsOpen((open) => !open)
                      } else {
                        setActivePage('Terms & Conditions')
                        setTermsOpen(true)
                        setTermsView('create')
                        setMobileMenuOpen(false)
                      }
                    }}
                    aria-expanded={termsOpen}
                    aria-current={isActive ? 'page' : undefined}
                    className={`${navButtonBase} ${
                      sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                    } ${isActive ? navActive : navIdle}`}
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
                            termsOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {termsOpen && !sidebarCollapsed && (
                    <div className="ml-5 space-y-0.5 border-l border-blue-300/20 py-1.5 pl-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActivePage('Terms & Conditions')
                          setTermsView('create')
                          setTermsOpen(true)
                          setMobileMenuOpen(false)
                        }}
                        className="flex min-h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold text-white transition-colors hover:bg-blue-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                      >
                        <FilePlus2 size={15} />
                        Create Terms
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActivePage('Terms & Conditions')
                          setTermsView('saved')
                          setTermsOpen(true)
                          setMobileMenuOpen(false)
                        }}
                        className="flex min-h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold text-slate-300 transition-colors hover:bg-blue-500/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                      >
                        <Files size={15} />
                        Saved Terms
                      </button>
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
                className={`${navButtonBase} ${
                  sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                } ${isActive ? navActive : navIdle}`}
              >
                <Icon size={19} strokeWidth={1.9} />
                {!sidebarCollapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="hidden shrink-0 border-t border-white/10 p-3 md:block">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg text-xs text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>

            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2 text-sm"
            >
              <span className="hidden text-slate-400 sm:inline">Airtech</span>
              <span aria-hidden="true" className="hidden text-slate-300 sm:inline">
                /
              </span>
              <span className="truncate font-medium text-slate-700">
                {activePage}
              </span>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              aria-label="Notifications"
              title="Notifications"
              onClick={() =>
                window.alert('Notifications are not connected yet.')
              }
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#142d4e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Bell size={19} />
            </button>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-2.5">
              <div
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800 ring-1 ring-blue-200"
              >
                A
              </div>
              <p className="hidden text-sm font-medium text-slate-800 sm:block">
                Airtech User
              </p>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            {renderPage()}
          </div>
        </main>
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
        <h1 className="text-2xl font-bold tracking-tight text-[#142d4e] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Wrench size={25} strokeWidth={1.8} />
        </div>
        <h2 className="mt-4 text-base font-semibold text-[#142d4e]">
          Coming soon
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          This section isn’t available yet. It will be added in a later update.
        </p>
      </div>
    </div>
  )
}

export default AppLayout
