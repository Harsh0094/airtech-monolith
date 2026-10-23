
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  RefreshCw,
  FileText,
  Download,
  Eye,
  AlertCircle,
  CalendarDays,
  UserRound,
  IndianRupee,
  X,
  Mail,
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
        records.map((record: Record<string, unknown>) =>
          normalizeQuotation(record),
        ),
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
      link.download = `quotation-${quotation.quotation_number || id}.pdf`
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

  function clearFilters() {
    setSearch('')
    setCategory('')
    setStatus('')
    setDateFrom('')
    setDateTo('')
  }

  const inputClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white text-slate-800'

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Retrieve Quotation
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Find saved quotations, review their values and download PDFs.
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
          Refresh
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Matching quotations</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? '—' : filteredQuotations.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="flex items-center gap-1 text-sm text-slate-500">
            <IndianRupee className="h-4 w-4" />
            Total quotation value
          </p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {loading
              ? '—'
              : formatCurrency(
                filteredQuotations.reduce(
                  (sum, item) => sum + Number(item.total ?? 0),
                  0,
                ),
              )}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Categories represented</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {
              new Set(
                filteredQuotations.map((item) => item.category),
              ).size
            }
          </p>
        </div>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="flex items-center gap-2 font-semibold text-slate-800">
          <Search className="h-4 w-4" />
          Search and filters
        </h3>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Type quotation number or customer name..."
            aria-label="Search quotations"
            className={`${inputClass} pl-9`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-sm text-slate-600">
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={inputClass}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={inputClass}
            >
              <option value="">All statuses</option>
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            From date
            <Input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            To date
            <Input
              type="date"
              min={dateFrom || undefined}
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Clear filters
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-800">
            <CalendarDays className="h-4 w-4" />
            Saved quotation register
          </h3>
          <span className="text-sm text-slate-500">
            {filteredQuotations.length} records
          </span>
        </div>

        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">
            Loading saved quotations...
          </p>
        ) : filteredQuotations.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">
              No saved quotations found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search or select All categories.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[
                    'Quotation number',
                    'Customer',
                    'Category',
                    'Date',
                    'Total',
                    'Status',
                    'Action',
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="border-b border-slate-200 px-4 py-3 font-medium"
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
                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-blue-700">
                      {quotation.quotation_number || '—'}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-800">
                            {quotation.customer_name || '—'}
                          </p>
                          {quotation.customer_company && (
                            <p className="mt-1 text-xs text-slate-500">
                              {quotation.customer_company}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      {quotation.category || '—'}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      {formatDate(quotation.quotation_date)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 font-semibold">
                      {formatCurrency(quotation.total)}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {quotation.status || 'Draft'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => viewQuotation(quotation)}
                          title="View quotation PDF"
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.alert(
                              'Send Mail button is ready. Outlook integration will be added in the next step.',
                            )
                          }}
                          title="Send quotation by email"
                        >
                          <Mail className="mr-1 h-4 w-4" />
                          Send Mail
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void downloadPdf(quotation)}
                          disabled={downloadingId === quotation.id}
                          title="Download quotation PDF"
                        >
                          <Download className="mr-1 h-4 w-4" />
                          {downloadingId === quotation.id
                            ? 'Preparing...'
                            : 'PDF'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          Displaying {filteredQuotations.length} of {quotations.length} loaded records.
        </div>
      </section>

      {/* Simple PDF preview modal */}
      {pdfQuotation && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3"
          onClick={() => setPdfQuotation(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Quotation PDF preview"
            className="relative h-[90vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPdfQuotation(null)}
              aria-label="Close PDF preview"
              className="absolute right-3 top-3 z-10 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow hover:bg-slate-100"
            >
              Done ✕
            </button>

            <iframe
              key={pdfUrl}
              title={`Quotation ${pdfQuotation.quotation_number}`}
              src={pdfUrl}
              className="h-full w-full border-0"
            />
          </div>
        </div>
      )}



      {/* Existing quotation details modal */}
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
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <h3
                  id="quotation-detail-title"
                  className="text-xl font-bold text-slate-900"
                >
                  {selected.quotation_number}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Saved quotation details
                </p>
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
                <Detail label="Status" value={selected.status} />
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
                        <th className="p-3">Description</th>
                        <th className="p-3">Code</th>
                        <th className="p-3 text-right">Quantity</th>
                        <th className="p-3 text-right">Rate</th>
                        <th className="p-3 text-right">Amount</th>
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
                          <td className="whitespace-nowrap p-3 text-right">
                            {formatCurrency(item.rate)}
                          </td>
                          <td className="whitespace-nowrap p-3 text-right font-medium">
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
                  <span>{formatCurrency(selected.total)}</span>
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
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
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
      <span className="text-slate-800">{formatCurrency(value)}</span>
    </div>
  )
}

export default RetrieveQuotation
