
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
    <main className="mx-auto w-full max-w-[1440px] space-y-7 pb-10">
      {/* Page heading */}
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-slate-500">
              Airtech Workspace
            </p>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#142d4e] sm:text-[30px]">
            Quotation Management
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Create quotations, retrieve saved records, and review quotation values.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => openCreate('')}
          className="h-10 shrink-0 rounded-lg bg-[#142d4e] px-4 font-semibold text-white shadow-sm transition-colors hover:bg-[#1d416b]"
        >
          <FilePlus2 size={16} className="mr-2" strokeWidth={1.8} />
          New Quotation
        </Button>
      </header>

      {/* Premium navigation */}
      <div className="border-b border-slate-200 pb-4">
        <div
          role="tablist"
          aria-label="Quotation sections"
          className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
        >
          <button
            type="button"
            role="tab"
            id="quotation-create-tab"
            aria-controls="quotation-create-panel"
            aria-selected={activeTab === 'create'}
            onClick={() => setActiveTab('create')}
            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 sm:px-5 ${
              activeTab === 'create'
                ? 'bg-[#142d4e] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FilePlus2 size={16} strokeWidth={1.8} />
            Create Quotation
          </button>

          <button
            type="button"
            role="tab"
            id="quotation-retrieve-tab"
            aria-controls="quotation-retrieve-panel"
            aria-selected={activeTab === 'retrieve'}
            onClick={() => setActiveTab('retrieve')}
            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 sm:px-5 ${
              activeTab === 'retrieve'
                ? 'bg-[#142d4e] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FileText size={16} strokeWidth={1.8} />
            Retrieve Quotation
          </button>
        </div>
      </div>

      {/* Create tab */}
      {activeTab === 'create' && (
        <section
          id="quotation-create-panel"
          role="tabpanel"
          aria-labelledby="quotation-create-tab"
          className="space-y-6"
        >
          <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardHeader className="space-y-1 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold tracking-tight text-[#142d4e]">
                    Choose quotation category
                  </CardTitle>
                  <p className="text-sm leading-5 text-slate-500">
                    Select the type of quotation you want to prepare.
                  </p>
                </div>

                <span className="inline-flex w-fit items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                  5 categories
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                {quotationCategories.map((category) => {
                  const Icon = category.icon
                  const selected = selectedCategory === category.name

                  return (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() => openCreate(category.name)}
                      aria-pressed={selected}
                      className={`group relative flex min-h-[148px] flex-col items-start rounded-xl border p-4 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
                        selected
                          ? 'border-[#142d4e] bg-slate-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                            selected
                              ? 'border-[#142d4e] bg-[#142d4e] text-white'
                              : 'border-blue-100 bg-blue-50 text-blue-700 group-hover:border-blue-200 group-hover:bg-blue-100'
                          }`}
                        >
                          <Icon size={19} strokeWidth={1.8} />
                        </span>

                        {selected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#142d4e] text-white">
                            <Check size={12} strokeWidth={2.5} />
                          </span>
                        )}
                      </div>

                      <span className="mt-4 text-sm font-semibold tracking-tight text-slate-900">
                        {category.name}
                      </span>

                      <span className="mt-1 text-xs leading-5 text-slate-500">
                        {category.description}
                      </span>

                      <span
                        className={`mt-auto flex items-center gap-1 pt-3 text-xs font-semibold transition-colors ${
                          selected
                            ? 'text-[#142d4e]'
                            : 'text-slate-400 group-hover:text-blue-700'
                        }`}
                      >
                        {selected ? 'Selected' : 'Create quotation'}
                        {!selected && <ArrowRight size={13} />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {selectedCategory && (
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-white text-blue-700">
                  <Check size={16} />
                </span>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                    Selected category
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[#142d4e]">
                    {selectedCategory}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className="self-start rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:self-center"
              >
                Clear selection
              </button>
            </div>
          )}

          <div className="min-w-0">
            <CreateQuotation
              key={selectedCategory || 'new'}
              initialCategory={selectedCategory}
            />
          </div>
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
    </main>
  )
}

export default Quotations
