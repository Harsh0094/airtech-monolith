import { useCallback, useEffect, useMemo, useState } from 'react'

import {

  Search,

  RefreshCw,

  FileText,

  Download,

  Eye,

  AlertCircle,

  IndianRupee,

  X,

  Mail,

  Layers,

  ListFilter,
  Trash2,

} from 'lucide-react'



import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'



const API_URL = 'http://127.0.0.1:8000/api/quotations'



type QuotationItem = {

  description: string

  product_code?: string

  quantity: number

  unit?: string

  rate: number

  rate_unit?: string

  duration?: number

  amount?: number

  line_total?: number

}



type Quotation = {

  id: string

  quotation_id?: string

  quotation_number: string

  customer_name: string

  customer_company?: string

  contact_person?: string

  customer_email?: string

  customer_phone?: string

  customer_address?: string

  customer_gst?: string

  site_name?: string

  site_address?: string

  category: string

  quotation_date: string

  created_at?: string

  updated_at?: string

  valid_until?: string

  validity_days?: number

  status: string

  items?: QuotationItem[]

  subtotal?: number

  discount?: number

  tax?: number

  gst?: number

  tax_amount?: number

  tax_percent?: number

  tax_type?: string

  cgst?: number

  sgst?: number

  igst?: number

  total?: number

  terms?: string

  notes?: string

  frequency_details?: string

  contract_months?: number

  maintenance_coverage?: string

}



const CATEGORIES = [

  'Outright Sale',

  'Airtime/Frequency',

  'Rental',

  'CAMC',

  'NAMC',

]



const STATUSES = [

  'Draft',

  'Sent',

  'Pending',

  'Approved',

  'Rejected',

  'Expired',

]



const STATUS_STYLES: Record<string, string> = {

  draft: 'bg-slate-100 text-slate-700 ring-slate-200',

  sent: 'bg-blue-50 text-blue-700 ring-blue-200',

  pending: 'bg-amber-50 text-amber-800 ring-amber-200',

  approved: 'bg-green-50 text-green-700 ring-green-200',

  rejected: 'bg-red-50 text-red-700 ring-red-200',

  expired: 'bg-orange-50 text-orange-700 ring-orange-200',

}



function formatCurrency(value?: number) {

  return new Intl.NumberFormat('en-IN', {

    style: 'currency',

    currency: 'INR',

    maximumFractionDigits: 2,

  }).format(Number(value ?? 0))

}



function formatDate(value?: string) {

  if (!value) return '—'



  const date = new Date(`${value.slice(0, 10)}T00:00:00`)



  if (Number.isNaN(date.getTime())) return value



  return date.toLocaleDateString('en-IN', {

    day: '2-digit',

    month: 'short',

    year: 'numeric',

  })

}



function normalizeQuotation(raw: Record<string, unknown>): Quotation {

  return {

    ...(raw as unknown as Quotation),

    id: String(raw.id ?? raw.quotation_id ?? ''),

    quotation_id: String(raw.quotation_id ?? raw.id ?? ''),

    quotation_number: String(raw.quotation_number ?? ''),

    customer_name: String(raw.customer_name ?? ''),

    customer_company: String(raw.customer_company ?? ''),

    contact_person: String(raw.contact_person ?? ''),

    customer_email: String(raw.customer_email ?? ''),

    customer_phone: String(raw.customer_phone ?? ''),

    category: String(raw.category ?? ''),

    quotation_date: String(raw.quotation_date ?? ''),

    status: String(raw.status ?? 'Draft'),

    subtotal: Number(raw.subtotal ?? 0),

    discount: Number(raw.discount ?? 0),

    tax: Number(raw.tax ?? raw.tax_amount ?? raw.gst ?? 0),

    tax_amount: Number(raw.tax_amount ?? raw.gst ?? 0),

    tax_percent: Number(raw.tax_percent ?? 0),

    total: Number(raw.total ?? 0),

    items: Array.isArray(raw.items)

      ? (raw.items as QuotationItem[])

      : [],

  }

}



/* ---------- presentational helpers ---------- */



function StatusBadge({ status }: { status?: string }) {

  const label = status || 'Draft'

  const style = STATUS_STYLES[label.toLowerCase()] ?? STATUS_STYLES.draft

  return (

    <span

      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}

    >

      {label}

    </span>

  )

}



function StatCard({

  label,

  icon,

  children,

}: {

  label: string

  icon: React.ReactNode

  children: React.ReactNode

}) {

  return (

    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">

      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">

        {icon}

      </span>

      <div className="min-w-0">

        <p className="text-sm text-slate-500">{label}</p>

        <p className="truncate text-xl font-bold tabular-nums text-slate-900">

          {children}

        </p>

      </div>

    </div>

  )

}



function SkeletonRows() {

  return (

    <div aria-busy="true" aria-label="Loading quotations" className="divide-y divide-slate-100">

      {Array.from({ length: 5 }).map((_, i) => (

        <div key={i} className="flex items-center gap-4 px-4 py-4">

          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />

          <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />

          <div className="hidden h-4 w-24 animate-pulse rounded bg-slate-100 md:block" />

          <div className="hidden h-4 w-20 animate-pulse rounded bg-slate-100 md:block" />

          <div className="h-8 w-40 animate-pulse rounded bg-slate-100" />

        </div>

      ))}

    </div>

  )

}



function RetrieveQuotation() {

  const [quotations, setQuotations] = useState<Quotation[]>([])

  const [search, setSearch] = useState('')

  const [category, setCategory] = useState('')

  const [status, setStatus] = useState('')

  const [dateFrom, setDateFrom] = useState('')

  const [dateTo, setDateTo] = useState('')

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [selected, setSelected] = useState<Quotation | null>(null)

  const [loadingDetails] = useState(false)

  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [pdfQuotation, setPdfQuotation] = useState<Quotation | null>(null)



  const pdfUrl = pdfQuotation

    ? `${API_URL}/${encodeURIComponent(

      pdfQuotation.quotation_id || pdfQuotation.id,

    )}/pdf`

    : ''



  const loadQuotations = useCallback(async (signal?: AbortSignal) => {

    setLoading(true)

    setError('')



    try {

      const response = await fetch(API_URL, { signal })



      if (!response.ok) {

        throw new Error(`HTTP ${response.status}`)

      }



      const data = await response.json()

      const records = Array.isArray(data.quotations)

        ? data.quotations

        : []



      setQuotations(

        records

          .map((record: Record<string, unknown>) =>

            normalizeQuotation(record),

          )

          .sort((a: Quotation, b: Quotation) => {

            // Prefer the actual creation timestamp; fall back to quotation date.

            const timestampA = Date.parse(

              a.created_at || a.updated_at || a.quotation_date || '',

            )

            const timestampB = Date.parse(

              b.created_at || b.updated_at || b.quotation_date || '',

            )



            if (Number.isFinite(timestampA) && Number.isFinite(timestampB) && timestampA !== timestampB) {

              return timestampB - timestampA

            }



            // Stable fallback when timestamps are missing or equal.

            return (b.quotation_number || '').localeCompare(

              a.quotation_number || '',

            )

          }),

      )

    } catch (err) {

      if (err instanceof Error && err.name === 'AbortError') return



      setError(

        'Could not load quotations. Check that the backend is running at http://127.0.0.1:8000.',

      )

      setQuotations([])

    } finally {

      if (!signal?.aborted) setLoading(false)

    }

  }, [])



  useEffect(() => {

    const controller = new AbortController()

    void loadQuotations(controller.signal)



    return () => controller.abort()

  }, [loadQuotations])



  const filteredQuotations = useMemo(() => {

    const searchTerm = search.trim().toLowerCase()



    return quotations.filter((quotation) => {

      const matchesSearch =

        !searchTerm ||

        [

          quotation.quotation_number,

          quotation.customer_name,

          quotation.customer_company,

          quotation.contact_person,

          quotation.customer_email,

          quotation.customer_phone,

          quotation.category,

        ].some((value) =>

          String(value ?? '').toLowerCase().includes(searchTerm),

        )



      const matchesCategory =

        !category || quotation.category === category



      const matchesStatus =

        !status ||

        (quotation.status || 'Draft').toLowerCase() ===

        status.toLowerCase()



      const quotationDate =

        quotation.quotation_date?.slice(0, 10) ?? ''



      const matchesDateFrom =

        !dateFrom ||

        (quotationDate !== '' && quotationDate >= dateFrom)



      const matchesDateTo =

        !dateTo ||

        (quotationDate !== '' && quotationDate <= dateTo)



      return (

        matchesSearch &&

        matchesCategory &&

        matchesStatus &&

        matchesDateFrom &&

        matchesDateTo

      )

    })

  }, [quotations, search, category, status, dateFrom, dateTo])



  function viewQuotation(quotation: Quotation) {

    setError('')



    const id = quotation.quotation_id || quotation.id



    if (!id) {

      setError('Could not find the quotation ID.')

      return

    }



    setSelected(null)

    setPdfQuotation(quotation)

  }



  async function downloadPdf(quotation: Quotation) {

    const id = quotation.quotation_id || quotation.id



    if (!id) {

      setError('Could not find the quotation ID.')

      return

    }



    setError('')

    setDownloadingId(quotation.id)



    try {

      const response = await fetch(

        `${API_URL}/${encodeURIComponent(id)}/pdf`,

      )



      if (!response.ok) {

        throw new Error(`HTTP ${response.status}`)

      }



      const pdfBlob = await response.blob()

      const objectUrl = URL.createObjectURL(pdfBlob)

      const link = document.createElement('a')



      link.href = objectUrl

      const type = quotation.category || 'Quotation'

      const client = quotation.customer_company || quotation.customer_name || 'Client'

      const quoteNo = quotation.quotation_number || id



      const safeName = (value: string) =>

          value.replace(/[<>:"\/\\|?*\x00-\x1F]/g, '').trim().replace(/\s+/g, '_')



      link.download = `${safeName(type)}_${safeName(client)}_${safeName(quoteNo)}.pdf`

      document.body.appendChild(link)

      link.click()

      link.remove()



      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)

    } catch {

      setError(

        `Could not download the PDF for ${quotation.quotation_number}. Check that the backend is running.`,

      )

    } finally {

      setDownloadingId(null)

    }

  }



  async function deleteQuotation(quotation: Quotation) {
    const id = quotation.quotation_id || quotation.id

    if (!id) {
      setError('Could not find the quotation ID.')
      return
    }

    const confirmed = window.confirm(
      `Delete quotation ${quotation.quotation_number || id} for ${quotation.customer_name || 'this customer'}? This will permanently delete the quotation and its items.`,
    )

    if (!confirmed) return

    setError('')
    setDeletingId(quotation.id)

    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          result.detail || `Could not delete quotation (HTTP ${response.status}).`,
        )
      }

      setQuotations((current) =>
        current.filter((item) => item.id !== quotation.id),
      )

      if (pdfQuotation && (pdfQuotation.quotation_id || pdfQuotation.id) === id) {
        setPdfQuotation(null)
      }

      if (selected && (selected.quotation_id || selected.id) === id) {
        setSelected(null)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while deleting the quotation.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  async function sendMailDraft(quotation: Quotation) {

    const email = quotation.customer_email?.trim()



    if (!email) {

      window.alert(

        'This quotation has no customer email address. Please add one first.',

      )

      return

    }



    const contactName =

      quotation.contact_person?.trim() ||

      quotation.customer_name?.trim() ||

      'Customer'



    const categoryName =

      quotation.category === 'Airtime/Frequency'

        ? 'Airtime'

        : quotation.category?.trim() || 'Quotation'



    const companyName =

      quotation.customer_company?.trim() ||

      quotation.customer_name?.trim() ||

      'Customer'



    const subject = `${categoryName} Quotation - ${companyName} - ${quotation.quotation_number} | Airtech Solutions India Pvt. Ltd.`



    const body = `Dear ${contactName},



Greetings from Airtech Solutions India Pvt. Ltd.



Please find the quotation ${quotation.quotation_number} for your review and consideration.



Should you require any clarification or additional information, please feel free to contact us. We will be happy to assist you.



Thank you for your time and consideration. We look forward to hearing from you.



Best regards,

Airtech Solutions India Pvt. Ltd.`



    try {

      const response = await fetch('http://127.0.0.1:8000/api/outlook/draft', {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({

          quotation_id: quotation.quotation_id || quotation.id,

          recipient: email,

          subject,

          body,

        }),

      })



      const result = await response.json()



      if (!response.ok) {

        throw new Error(

          result.detail || 'Could not open the Outlook draft.',

        )

      }



      window.alert(

        'Outlook draft requested successfully. Please review the email and attached quotation PDF before sending.',

      )

    } catch (error) {

      const message =

        error instanceof Error

          ? error.message

          : 'An unexpected error occurred.'



      window.alert(`Could not create the Outlook draft: ${message}`)

    }

  }



  function clearFilters() {

    setSearch('')

    setCategory('')

    setStatus('')

    setDateFrom('')

    setDateTo('')

  }



  const hasFilters = Boolean(

    search.trim() || category || status || dateFrom || dateTo,

  )



  const inputClass =

    'h-10 w-full rounded-lg border border-slate-200 bg-white text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40'



  const rowActions = (quotation: Quotation) => (

    <div className="flex flex-wrap gap-2">

      <Button

        type="button"

        size="sm"

        variant="outline"

        onClick={() => viewQuotation(quotation)}

        title="View quotation PDF"

      >

        <Eye className="mr-1.5 h-4 w-4" />

        View

      </Button>



      <Button

        type="button"

        size="sm"

        variant="outline"

        onClick={() => void sendMailDraft(quotation)}

        title="Create Outlook draft with quotation PDF"

      >

        <Mail className="mr-1.5 h-4 w-4" />

        Email

      </Button>



      <Button

        type="button"

        size="sm"

        onClick={() => void downloadPdf(quotation)}

        disabled={downloadingId === quotation.id}

        title="Download quotation PDF"

      >

        <Download className="mr-1.5 h-4 w-4" />

        {downloadingId === quotation.id ? 'Preparing…' : 'PDF'}

      </Button>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => void deleteQuotation(quotation)}
        disabled={deletingId === quotation.id}
        title="Permanently delete quotation"
        className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
      >
        <Trash2 className="mr-1.5 h-4 w-4" />
        {deletingId === quotation.id ? 'Deleting…' : 'Delete'}
      </Button>

    </div>

  )



  return (

    <div className="space-y-5">

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

        <div>

          <h2 className="text-xl font-semibold text-slate-900">

            Saved quotations

          </h2>

          <p className="mt-1 text-sm text-slate-500">

            Search, preview, email or download any quotation you have saved.

          </p>

        </div>



        <Button

          type="button"

          variant="outline"

          onClick={() => void loadQuotations()}

          disabled={loading}

          className="gap-2 self-start"

        >

          <RefreshCw

            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}

          />

          {loading ? 'Refreshing…' : 'Refresh'}

        </Button>

      </div>



      {error && (

        <div

          role="alert"

          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"

        >

          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <span className="flex-1">{error}</span>

          <button

            type="button"

            onClick={() => setError('')}

            aria-label="Dismiss error"

            className="rounded p-0.5 text-red-500 hover:bg-red-100"

          >

            <X className="h-4 w-4" />

          </button>

        </div>

      )}



      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        <StatCard label="Matching quotations" icon={<FileText className="h-5 w-5" />}>

          {loading ? '—' : filteredQuotations.length}

        </StatCard>



        <StatCard label="Total value" icon={<IndianRupee className="h-5 w-5" />}>

          {loading

            ? '—'

            : formatCurrency(

              filteredQuotations.reduce(

                (sum, item) => sum + Number(item.total ?? 0),

                0,

              ),

            )}

        </StatCard>



        <StatCard label="Categories" icon={<Layers className="h-5 w-5" />}>

          {loading

            ? '—'

            : new Set(filteredQuotations.map((item) => item.category)).size}

        </StatCard>

      </div>



      <section

        aria-label="Search and filters"

        className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"

      >

        <div className="relative">

          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />

          <Input

            value={search}

            onChange={(event) => setSearch(event.target.value)}

            placeholder="Search by quotation number, customer, contact or email"

            aria-label="Search quotations"

            className={`${inputClass} pl-9 pr-9`}

          />

          {search && (

            <button

              type="button"

              onClick={() => setSearch('')}

              aria-label="Clear search"

              className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"

            >

              <X className="h-4 w-4" />

            </button>

          )}

        </div>



        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <label className="space-y-1 text-sm font-medium text-slate-600">

            Category

            <select

              value={category}

              onChange={(event) => setCategory(event.target.value)}

              className={`${inputClass} px-3 font-normal`}

            >

              <option value="">All categories</option>

              {CATEGORIES.map((item) => (

                <option key={item} value={item}>

                  {item}

                </option>

              ))}

            </select>

          </label>



          <label className="space-y-1 text-sm font-medium text-slate-600">

            Status

            <select

              value={status}

              onChange={(event) => setStatus(event.target.value)}

              className={`${inputClass} px-3 font-normal`}

            >

              <option value="">All statuses</option>

              {STATUSES.map((item) => (

                <option key={item} value={item}>

                  {item}

                </option>

              ))}

            </select>

          </label>



          <label className="space-y-1 text-sm font-medium text-slate-600">

            From date

            <Input

              type="date"

              value={dateFrom}

              max={dateTo || undefined}

              onChange={(event) => setDateFrom(event.target.value)}

              className={`${inputClass} font-normal`}

            />

          </label>



          <label className="space-y-1 text-sm font-medium text-slate-600">

            To date

            <Input

              type="date"

              min={dateFrom || undefined}

              value={dateTo}

              onChange={(event) => setDateTo(event.target.value)}

              className={`${inputClass} font-normal`}

            />

          </label>

        </div>



        {hasFilters && (

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">

            <p className="flex items-center gap-2 text-sm text-slate-500">

              <ListFilter className="h-4 w-4" />

              Showing {filteredQuotations.length} of {quotations.length}

            </p>

            <Button

              type="button"

              variant="ghost"

              size="sm"

              onClick={clearFilters}

              className="gap-1.5 text-blue-700 hover:text-blue-800"

            >

              <X className="h-4 w-4" />

              Clear filters

            </Button>

          </div>

        )}

      </section>



      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">

          <h3 className="font-semibold text-slate-800">Quotation register</h3>

          <span className="text-sm text-slate-500">

            {loading ? 'Loading…' : `${filteredQuotations.length} records`}

          </span>

        </div>



        {loading ? (

          <SkeletonRows />

        ) : filteredQuotations.length === 0 ? (

          <div className="p-10 text-center">

            <FileText className="mx-auto h-9 w-9 text-slate-300" />

            <p className="mt-3 font-semibold text-slate-700">

              {quotations.length === 0

                ? 'No saved quotations yet'

                : 'No quotations match your filters'}

            </p>

            <p className="mt-1 text-sm text-slate-500">

              {quotations.length === 0

                ? 'Quotations you create and save will appear here.'

                : 'Try a different search term or clear the filters.'}

            </p>

            {hasFilters && (

              <Button

                type="button"

                variant="outline"

                size="sm"

                onClick={clearFilters}

                className="mt-4"

              >

                Clear filters

              </Button>

            )}

          </div>

        ) : (

          <>

            {/* Table on larger screens */}

            <div className="hidden overflow-x-auto md:block">

              <table className="w-full min-w-[850px] text-left text-sm">

                <thead className="bg-slate-50 text-slate-600">

                  <tr>

                    {[

                      'Quotation',

                      'Customer',

                      'Category',

                      'Date',

                      'Total',

                      'Status',

                      'Actions',

                    ].map((heading) => (

                      <th

                        key={heading}

                        className={`border-b border-slate-200 px-4 py-3 font-medium ${heading === 'Total' ? 'text-right' : ''

                          }`}

                      >

                        {heading}

                      </th>

                    ))}

                  </tr>

                </thead>



                <tbody className="divide-y divide-slate-100">

                  {filteredQuotations.map((quotation) => (

                    <tr

                      key={quotation.id}

                      className="transition-colors hover:bg-slate-50"

                    >

                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-blue-700">

                        {quotation.quotation_number || '—'}

                      </td>



                      <td className="px-4 py-3.5">

                        <p className="font-medium text-slate-800">

                          {quotation.customer_name || '—'}

                        </p>

                        {quotation.contact_person && (

                          <p className="mt-0.5 text-xs text-slate-500">

                            {quotation.contact_person}

                          </p>

                        )}

                      </td>



                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">

                        {quotation.category || '—'}

                      </td>



                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">

                        {formatDate(quotation.quotation_date)}

                      </td>



                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums">

                        {formatCurrency(quotation.total)}

                      </td>



                      <td className="px-4 py-3.5">

                        <StatusBadge status={quotation.status} />

                      </td>



                      <td className="px-4 py-3.5">{rowActions(quotation)}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>



            {/* Cards on small screens */}

            <ul className="divide-y divide-slate-100 md:hidden">

              {filteredQuotations.map((quotation) => (

                <li key={quotation.id} className="space-y-3 p-4">

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <p className="font-semibold text-blue-700">

                        {quotation.quotation_number || '—'}

                      </p>

                      <p className="truncate font-medium text-slate-800">

                        {quotation.customer_name || '—'}

                      </p>

                    </div>

                    <StatusBadge status={quotation.status} />

                  </div>

                  <div className="flex items-end justify-between gap-3 text-sm text-slate-500">

                    <p>

                      {quotation.category || '—'}

                      <br />

                      {formatDate(quotation.quotation_date)}

                    </p>

                    <p className="text-lg font-semibold tabular-nums text-slate-900">

                      {formatCurrency(quotation.total)}

                    </p>

                  </div>

                  {rowActions(quotation)}

                </li>

              ))}

            </ul>

          </>

        )}



        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">

          Displaying {filteredQuotations.length} of {quotations.length} loaded records.

        </div>

      </section>



      {/* PDF preview modal */}

      {pdfQuotation && (

        <div

          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3"

          onClick={() => setPdfQuotation(null)}

        >

          <div

            role="dialog"

            aria-modal="true"

            aria-label="Quotation PDF preview"

            className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"

            onClick={(event) => event.stopPropagation()}

          >

            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">

              <div className="min-w-0">

                <p className="truncate font-semibold text-slate-900">

                  {pdfQuotation.quotation_number}

                </p>

                <p className="truncate text-xs text-slate-500">

                  {pdfQuotation.customer_name}

                </p>

              </div>

              <div className="flex shrink-0 gap-2">

                <Button

                  type="button"

                  size="sm"

                  variant="outline"

                  onClick={() => void downloadPdf(pdfQuotation)}

                  disabled={downloadingId === pdfQuotation.id}

                >

                  <Download className="mr-1.5 h-4 w-4" />

                  {downloadingId === pdfQuotation.id ? 'Preparing…' : 'Download'}

                </Button>

                <Button

                  type="button"

                  size="sm"

                  onClick={() => setPdfQuotation(null)}

                  aria-label="Close PDF preview"

                >

                  <X className="mr-1.5 h-4 w-4" />

                  Close

                </Button>

              </div>

            </div>



            <iframe

              key={pdfUrl}

              title={`Quotation ${pdfQuotation.quotation_number}`}

              src={pdfUrl}

              className="w-full flex-1 border-0 bg-slate-100"

            />

          </div>

        </div>

      )}



      {/* Quotation details modal */}

      {selected && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"

          onClick={() => setSelected(null)}

        >

          <div

            role="dialog"

            aria-modal="true"

            aria-labelledby="quotation-detail-title"

            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl"

            onClick={(event) => event.stopPropagation()}

          >

            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5">

              <div>

                <h3

                  id="quotation-detail-title"

                  className="text-xl font-bold text-slate-900"

                >

                  {selected.quotation_number}

                </h3>

                <div className="mt-1.5">

                  <StatusBadge status={selected.status} />

                </div>

              </div>



              <Button

                type="button"

                variant="outline"

                size="sm"

                onClick={() => setSelected(null)}

              >

                <X className="mr-1 h-4 w-4" />

                Close

              </Button>

            </div>



            <div className="space-y-6 p-5">

              {loadingDetails && (

                <p className="text-sm text-slate-500">

                  Loading full quotation details...

                </p>

              )}



              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <Detail label="Customer" value={selected.customer_name} />

                <Detail label="Company" value={selected.customer_company} />

                <Detail label="Contact person" value={selected.contact_person} />

                <Detail label="Email" value={selected.customer_email} />

                <Detail label="Phone" value={selected.customer_phone} />

                <Detail label="GST number" value={selected.customer_gst} />

                <Detail label="Category" value={selected.category} />

                <Detail

                  label="Quotation date"

                  value={formatDate(selected.quotation_date)}

                />

                <Detail

                  label="Valid until"

                  value={

                    selected.valid_until

                      ? formatDate(selected.valid_until)

                      : selected.validity_days != null

                        ? `${selected.validity_days} days`

                        : undefined

                  }

                />

                <Detail label="Site name" value={selected.site_name} />

                <Detail label="Site address" value={selected.site_address} />

              </div>



              {selected.customer_address && (

                <Detail

                  label="Customer address"

                  value={selected.customer_address}

                />

              )}



              {selected.frequency_details && (

                <Detail

                  label="Airtime / frequency details"

                  value={selected.frequency_details}

                />

              )}



              {selected.maintenance_coverage && (

                <Detail

                  label="Maintenance coverage"

                  value={selected.maintenance_coverage}

                />

              )}



              {selected.contract_months != null && (

                <Detail

                  label="Contract duration"

                  value={`${selected.contract_months} months`}

                />

              )}



              <div>

                <h4 className="mb-3 font-semibold text-slate-900">

                  Quotation items

                </h4>



                <div className="overflow-x-auto rounded-lg border border-slate-200">

                  <table className="w-full min-w-[600px] text-left text-sm">

                    <thead className="bg-slate-50 text-slate-600">

                      <tr>

                        <th className="p-3 font-medium">Description</th>

                        <th className="p-3 font-medium">Code</th>

                        <th className="p-3 text-right font-medium">Quantity</th>

                        <th className="p-3 text-right font-medium">Rate</th>

                        <th className="p-3 text-right font-medium">Amount</th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {(selected.items ?? []).map((item, index) => (

                        <tr key={`${item.product_code ?? ''}-${index}`}>

                          <td className="p-3">

                            <p className="font-medium">

                              {item.description || '—'}

                            </p>

                            {item.duration != null && (

                              <p className="mt-1 text-xs text-slate-500">

                                Duration: {item.duration} {item.rate_unit ?? ''}

                              </p>

                            )}

                          </td>

                          <td className="p-3">

                            {item.product_code || '—'}

                          </td>

                          <td className="p-3 text-right">

                            {item.quantity} {item.unit ?? ''}

                          </td>

                          <td className="whitespace-nowrap p-3 text-right tabular-nums">

                            {formatCurrency(item.rate)}

                          </td>

                          <td className="whitespace-nowrap p-3 text-right font-medium tabular-nums">

                            {formatCurrency(

                              item.line_total ??

                              item.amount ??

                              item.quantity * item.rate * (item.duration ?? 1),

                            )}

                          </td>

                        </tr>

                      ))}

                      {!loadingDetails && (selected.items ?? []).length === 0 && (

                        <tr>

                          <td

                            colSpan={5}

                            className="p-4 text-center text-slate-500"

                          >

                            No quotation items were returned.

                          </td>

                        </tr>

                      )}

                    </tbody>

                  </table>

                </div>

              </div>



              <div className="ml-auto max-w-sm space-y-2 rounded-lg bg-slate-50 p-4">

                <MoneyRow label="Subtotal" value={selected.subtotal} />

                <MoneyRow label="Discount" value={selected.discount} />

                <MoneyRow

                  label={`Tax${selected.tax_percent != null ? ` (${selected.tax_percent}%)` : ''}`}

                  value={selected.tax ?? selected.tax_amount ?? selected.gst}

                />



                {selected.tax_type === 'CGST/SGST' && (

                  <>

                    <MoneyRow label="CGST" value={selected.cgst} />

                    <MoneyRow label="SGST" value={selected.sgst} />

                  </>

                )}



                {selected.tax_type === 'IGST' && (

                  <MoneyRow label="IGST" value={selected.igst} />

                )}



                <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-lg font-bold text-slate-900">

                  <span>Total</span>

                  <span className="tabular-nums">{formatCurrency(selected.total)}</span>

                </div>

              </div>



              {selected.terms && (

                <Detail label="Terms and conditions" value={selected.terms} />

              )}



              {selected.notes && (

                <Detail label="Notes" value={selected.notes} />

              )}



              <div className="flex justify-end">

                <Button

                  type="button"

                  onClick={() => void downloadPdf(selected)}

                  disabled={downloadingId === selected.id}

                  className="gap-2"

                >

                  <Download className="h-4 w-4" />

                  {downloadingId === selected.id

                    ? 'Preparing PDF...'

                    : 'Download quotation PDF'}

                </Button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  )

}



function Detail({

  label,

  value,

}: {

  label: string

  value?: string | null

}) {

  return (

    <div className="min-w-0">

      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">

        {value || '—'}

      </p>

    </div>

  )

}



function MoneyRow({

  label,

  value,

}: {

  label: string

  value?: number

}) {

  return (

    <div className="flex justify-between gap-4 text-sm">

      <span className="text-slate-500">{label}</span>

      <span className="tabular-nums text-slate-800">{formatCurrency(value)}</span>

    </div>

  )

}



export default RetrieveQuotation
