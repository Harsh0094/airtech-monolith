import { useEffect, useState } from 'react'
import {
  FilePlus2,
  ShoppingCart,
  Radio,
  CalendarClock,
  Wrench,
  ClipboardCheck,
  FileText,
  ArrowRight,
  Check,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import CreateQuotation from '@/pages/CreateQuotation'
import RetrieveQuotation from '@/pages/RetrieveQuotation'

const quotationCategories = [
  {
    name: 'Outright Sale',
    description: 'Equipment and product sales',
    icon: ShoppingCart,
  },
  {
    name: 'Airtime/Frequency',
    description: 'Airtime and frequency services',
    icon: Radio,
  },
  {
    name: 'Rental',
    description: 'Equipment rental quotations',
    icon: CalendarClock,
  },
  {
    name: 'CAMC',
    description: 'Comprehensive maintenance contracts',
    icon: Wrench,
  },
  {
    name: 'NAMC',
    description: 'Non-comprehensive maintenance contracts',
    icon: ClipboardCheck,
  },
] as const

type QuotationCategory = (typeof quotationCategories)[number]['name']
type Tab = 'create' | 'retrieve'

const tabs = [
  { id: 'create', label: 'Create quotation', icon: FilePlus2 },
  { id: 'retrieve', label: 'Saved quotations', icon: FileText },
] as const

function Quotations() {
  const [activeTab, setActiveTab] = useState<Tab>('create')
  const [selectedCategory, setSelectedCategory] =
    useState<QuotationCategory | ''>('')

  useEffect(() => {
    function showCreateTab() {
      setActiveTab('create')
    }

    function selectCategory(event: Event) {
      const customEvent = event as CustomEvent<string>
      const category = customEvent.detail

      if (quotationCategories.some((item) => item.name === category)) {
        setSelectedCategory(category as QuotationCategory)
        setActiveTab('create')
      }
    }

    window.addEventListener('airtech:show-create-tab', showCreateTab)
    window.addEventListener('airtech:select-category', selectCategory)

    return () => {
      window.removeEventListener('airtech:show-create-tab', showCreateTab)
      window.removeEventListener('airtech:select-category', selectCategory)
    }
  }, [])

  function openCreate(category: QuotationCategory | '') {
    setSelectedCategory(category)
    setActiveTab('create')
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 pb-10">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-[#142d4e] sm:text-[30px]">
            Quotations
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            Prepare new quotations and find, preview, email or download the ones you have saved.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => openCreate('')}
          className="h-10 shrink-0 rounded-lg bg-[#142d4e] px-4 font-semibold text-white shadow-sm transition-colors hover:bg-[#1d416b]"
        >
          <FilePlus2 size={16} className="mr-2" strokeWidth={1.8} />
          New quotation
        </Button>
      </header>

      {/* Tabs: underline style */}
      <div
        role="tablist"
        aria-label="Quotation sections"
        className="flex gap-6 border-b border-slate-200"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`quotation-${id}-tab`}
              aria-controls={`quotation-${id}-panel`}
              aria-selected={active}
              onClick={() => setActiveTab(id)}
              className={`-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
                active
                  ? 'border-[#142d4e] text-[#142d4e]'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Create tab */}
      {activeTab === 'create' && (
        <section
          id="quotation-create-panel"
          role="tabpanel"
          aria-labelledby="quotation-create-tab"
          className="space-y-5"
        >
          {!selectedCategory ? (
            <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <CardTitle className="text-lg font-bold tracking-tight text-[#142d4e]">
                  What kind of quotation are you preparing?
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Pick a category to start. The form adapts to your choice, and you can switch category later without leaving the form.
                </p>
              </CardHeader>

              <CardContent className="p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                  {quotationCategories.map((category) => {
                    const Icon = category.icon

                    return (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => openCreate(category.name)}
                        className="group flex min-h-[148px] flex-col items-start rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100">
                          <Icon size={19} strokeWidth={1.8} />
                        </span>

                        <span className="mt-4 text-sm font-semibold tracking-tight text-slate-900">
                          {category.name}
                        </span>

                        <span className="mt-1 text-xs leading-5 text-slate-500">
                          {category.description}
                        </span>

                        <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-blue-700">
                          Start
                          <ArrowRight
                            size={13}
                            className="transition-transform group-hover:translate-x-0.5"
                          />
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-white text-blue-700">
                    <Check size={16} />
                  </span>
                  <p className="text-sm text-slate-600">
                    New quotation ·{' '}
                    <span className="font-semibold text-[#142d4e]">
                      {selectedCategory}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Start over
                </button>
              </div>

              <div className="min-w-0">
                <CreateQuotation
                  key={selectedCategory || 'new'}
                  initialCategory={selectedCategory}
                />
              </div>
            </>
          )}
        </section>
      )}

      {/* Retrieve tab */}
      {activeTab === 'retrieve' && (
        <section
          id="quotation-retrieve-panel"
          role="tabpanel"
          aria-labelledby="quotation-retrieve-tab"
          className="min-w-0"
        >
          <RetrieveQuotation />
        </section>
      )}
    </div>
  )
}

export default Quotations