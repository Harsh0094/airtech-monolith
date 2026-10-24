import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const categories = [
  'Outright Sale',
  'Airtime/Frequency',
  'Rental',
  'CAMC',
  'NAMC',
] as const

const categoryHints: Record<(typeof categories)[number], string> = {
  'Outright Sale': 'One-time purchase of equipment',
  'Airtime/Frequency': 'Radio airtime or frequency usage',
  Rental: 'Equipment hired by the day, month or year',
  CAMC: 'Comprehensive annual maintenance contract',
  NAMC: 'Non-comprehensive annual maintenance contract',
}

type Category = (typeof categories)[number]
type RateUnit = 'Days' | 'Months' | 'Years'
type TaxType = 'CGST/SGST' | 'IGST'

type QuotationItem = {
  id: number
  equipment: string
  quantity: string
  rate: string
  rateUnit: RateUnit
  duration: string
}

type TermsTemplate = {
  template_id: string
  name: string
  company: string
  status: string
  content_html: string
  include_in_pdf: boolean
}

const money = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)

const emptyItem = (id: number): QuotationItem => ({
  id,
  equipment: '',
  quantity: '1',
  rate: '',
  rateUnit: 'Months',
  duration: '1',
})

/* ---------- presentational helpers (no business logic) ---------- */

const selectClass =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40'

function SectionHeader({
  step,
  title,
  description,
}: {
  step?: number
  title: string
  description?: string
}) {
  return (
    <CardHeader className="border-b border-slate-100 pb-4">
      <div className="flex items-start gap-3">
        {step != null && (
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {step}
          </span>
        )}
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>
    </CardHeader>
  )
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  className = '',
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

function ReviewField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-900">{children}</div>
    </div>
  )
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="text-slate-400">{children}</span>
}

function Totals({
  subtotal,
  taxType,
  rate,
  taxAmount,
  grandTotal,
}: {
  subtotal: number
  taxType: TaxType
  rate: number
  taxAmount: number
  grandTotal: number
}) {
  const row = (label: string, value: number) => (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="tabular-nums text-slate-800">{money(value)}</span>
    </div>
  )
  return (
    <div className="space-y-2.5">
      {row('Subtotal', subtotal)}
      {taxType === 'IGST' ? (
        row(`IGST (${rate}%)`, taxAmount)
      ) : (
        <>
          {row(`CGST (${rate / 2}%)`, taxAmount / 2)}
          {row(`SGST (${rate / 2}%)`, taxAmount / 2)}
        </>
      )}
      <div className="flex items-baseline justify-between gap-4 border-t border-slate-200 pt-3">
        <span className="font-semibold text-slate-900">Grand total</span>
        <span className="text-2xl font-bold tabular-nums text-blue-700">
          {money(grandTotal)}
        </span>
      </div>
    </div>
  )
}

function CreateQuotation({
  initialCategory = '',
}: {
  initialCategory?: Category | ''
}) {
  const [customerName, setCustomerName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [siteName, setSiteName] = useState('')
  const [siteAddress, setSiteAddress] = useState('')

  const [category, setCategory] = useState<Category | ''>(initialCategory)
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [validityDays, setValidityDays] = useState('30')
  const [notes, setNotes] = useState('')
  const [termsTemplates, setTermsTemplates] = useState<TermsTemplate[]>([])
  const [selectedTermsTemplateId, setSelectedTermsTemplateId] = useState('')
  const [termsTemplatesError, setTermsTemplatesError] = useState('')

  const [items, setItems] = useState<QuotationItem[]>([])
  const [nextItemId, setNextItemId] = useState(1)
  const [entry, setEntry] = useState<QuotationItem>(() => emptyItem(0))

  const [gstRate, setGstRate] = useState('18')
  const [taxType, setTaxType] = useState<TaxType>('CGST/SGST')
  const [showReview, setShowReview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isCreatingMailDraft, setIsCreatingMailDraft] = useState(false)
  const [savedQuotationId, setSavedQuotationId] = useState('')
  const [savedQuotationNumber, setSavedQuotationNumber] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  const [otherItemName, setOtherItemName] = useState('')
  const [otherQuantity, setOtherQuantity] = useState('1')
  const [otherUnitPrice, setOtherUnitPrice] = useState('')
  const [frequencyDetails, setFrequencyDetails] = useState('')
  const [contractMonths, setContractMonths] = useState('12')
  const [maintenanceCoverage, setMaintenanceCoverage] = useState('')


  useEffect(() => {
    let cancelled = false

    async function loadTermsTemplates() {
      try {
        const response = await fetch(
          'http://127.0.0.1:8000/api/terms-templates/',
        )

        if (!response.ok) {
          throw new Error('Could not load saved terms templates.')
        }

        const result = await response.json()
        const templates: TermsTemplate[] = result.templates ?? []

        if (!cancelled) {
          setTermsTemplates(
            templates.filter((template) => template.status === 'Active'),
          )
          setTermsTemplatesError('')
        }
      } catch {
        if (!cancelled) {
          setTermsTemplatesError(
            'Could not load saved terms. Check that the backend is running.',
          )
        }
      }
    }

    void loadTermsTemplates()

    return () => {
      cancelled = true
    }
  }, [])

  const itemAmount = (item: QuotationItem) =>
    Math.max(0, Number(item.quantity) || 0) *
    Math.max(0, Number(item.rate) || 0) *
    Math.max(0, Number(item.duration) || 0)

  const rentalSubtotal = items.reduce(
    (sum, item) => sum + itemAmount(item),
    0,
  )

  const otherSubtotal =
    Math.max(0, Number(otherQuantity) || 0) *
    Math.max(0, Number(otherUnitPrice) || 0)

  const subtotal = category === 'Rental' ? rentalSubtotal : otherSubtotal
  const validGstRate = Math.min(100, Math.max(0, Number(gstRate) || 0))
  const taxAmount = (subtotal * validGstRate) / 100
  const grandTotal = subtotal + taxAmount

  function updateItem(
    id: number,
    field: keyof Omit<QuotationItem, 'id'>,
    value: string,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    )
  }

  function updateEntry(
    field: keyof Omit<QuotationItem, 'id'>,
    value: string,
  ) {
    setEntry((current) => ({ ...current, [field]: value }))
  }

  function addItem(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    if (!entry.equipment.trim()) {
      alert('Please enter a product or equipment name.')
      return
    }

    if (
      Number(entry.quantity) < 1 ||
      Number(entry.duration) < 1 ||
      entry.rate.trim() === '' ||
      !Number.isFinite(Number(entry.rate)) ||
      Number(entry.rate) < 0
    ) {
      alert('Please enter a valid quantity, duration and rate.')
      return
    }

    setItems((current) => [
      ...current,
      { ...entry, id: nextItemId, equipment: entry.equipment.trim() },
    ])
    setNextItemId((current) => current + 1)
    setEntry(emptyItem(0))
  }

  function removeItem(id: number) {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  function resetForm() {
    setSavedQuotationId('')
    setSavedQuotationNumber('')
    setSaveError('')
    setSaveMessage('')
    setCustomerName('')
    setContactPerson('')
    setContactEmail('')
    setContactPhone('')
    setCustomerAddress('')
    setSiteName('')
    setSiteAddress('')
    setCategory(initialCategory)
    setQuotationDate(new Date().toISOString().slice(0, 10))
    setValidityDays('30')
    setNotes('')
    setSelectedTermsTemplateId('')
    setItems([])
    setNextItemId(1)
    setEntry(emptyItem(0))
    setGstRate('18')
    setTaxType('CGST/SGST')
    setOtherItemName('')
    setOtherQuantity('1')
    setOtherUnitPrice('')
    setFrequencyDetails('')
    setContractMonths('12')
    setMaintenanceCoverage('')
    setShowReview(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!category) {
      alert('Please select a quotation category.')
      return
    }

    if (category === 'Rental') {
      if (items.length === 0) {
        alert('Please add at least one rental item.')
        return
      }

      if (
        items.some(
          (item) =>
            !item.equipment.trim() ||
            Number(item.quantity) < 1 ||
            Number(item.duration) < 1 ||
            item.rate.trim() === '' ||
            Number(item.rate) < 0,
        )
      ) {
        alert('Please check all rental item details.')
        return
      }
    } else {
      if (!otherItemName.trim() || otherUnitPrice.trim() === '') {
        alert('Please enter the product/service name and unit price.')
        return
      }

      if (Number(otherQuantity) < 1 || Number(otherUnitPrice) < 0) {
        alert('Please enter a valid quantity and price.')
        return
      }

      if (
        category === 'Airtime/Frequency' &&
        !frequencyDetails.trim()
      ) {
        alert('Please enter the airtime/frequency details.')
        return
      }

      if (
        (category === 'CAMC' || category === 'NAMC') &&
        (!maintenanceCoverage || Number(contractMonths) < 1)
      ) {
        alert('Please enter the contract period and maintenance coverage.')
        return
      }
    }

    setShowReview(true)
  }

  async function saveQuotation() {
    if (!category || isSaving) return

    setIsSaving(true)
    setSaveError('')
    setSaveMessage('')

    const quotationItems =
      category === 'Rental'
        ? items.map((item) => ({
          description: item.equipment,
          product_code: '',
          quantity: Number(item.quantity),
          unit: 'Nos',
          rate: Number(item.rate),
          rate_unit: item.rateUnit,
          duration: Number(item.duration),
        }))
        : [{
          description: otherItemName.trim(),
          product_code: '',
          quantity: Number(otherQuantity),
          unit: 'Nos',
          rate: Number(otherUnitPrice),
          rate_unit: '',
          duration: 1,
        }]

    const payload = {
      customer_name: customerName.trim(),
      customer_company: customerName.trim(),
      contact_person: contactPerson.trim(),
      customer_email: contactEmail.trim(),
      customer_phone: contactPhone.trim(),
      customer_address: customerAddress.trim(),
      site_name: siteName.trim(),
      site_address: siteAddress.trim(),
      category,
      quotation_date: quotationDate,
      validity_days: Number(validityDays),
      status: 'Draft',
      items: quotationItems,
      frequency_details: frequencyDetails.trim(),
      contract_months: Number(contractMonths),
      maintenance_coverage: maintenanceCoverage,
      tax_type: taxType,
      tax_percent: Number(gstRate),
      discount: 0,
      notes: notes.trim(),
      terms: notes.trim(),
      terms_template_id: selectedTermsTemplateId || null,
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        const detail = result?.detail
        throw new Error(
          typeof detail === 'string'
            ? detail
            : 'The backend could not save this quotation. Check the required fields.',
        )
      }

      const quotation = result.quotation
      if (!quotation?.id) {
        throw new Error('The backend saved no quotation ID in its response.')
      }

      setSavedQuotationId(quotation.id)
      setSavedQuotationNumber(quotation.quotation_number || '')
      setSaveMessage('Quotation saved to Excel successfully.')
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Could not connect to the Airtech backend.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function downloadQuotationPdf() {
    if (!savedQuotationId || isDownloadingPdf) return

    setIsDownloadingPdf(true)
    setSaveError('')
    setSaveMessage('')

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/quotations/${encodeURIComponent(savedQuotationId)}/pdf`,
      )

      if (!response.ok) {
        let message = 'Could not generate the quotation PDF.'
        try {
          const errorResult = await response.json()
          if (typeof errorResult?.detail === 'string') {
            message = errorResult.detail
          }
        } catch {
          // Keep the default message if the server did not return JSON.
        }
        throw new Error(message)
      }

      const pdfBlob = await response.blob()
      if (pdfBlob.size === 0) {
        throw new Error('The PDF response was empty. Please try again.')
      }

      const cleanPart = (value: string) =>
        value
          .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
          .trim()
          .replace(/\s+/g, '_')
          .replace(/^\.+|\.+$/g, '') || 'Unknown'

      const categoryName = category === 'Airtime/Frequency' ? 'Airtime' : category || 'Quotation'
      const companyName = customerName.trim() || 'Customer'
      const quotationNumber = savedQuotationNumber || savedQuotationId
      const filename = `${cleanPart(categoryName)}_${cleanPart(companyName)}_${cleanPart(quotationNumber)}.pdf`

      const objectUrl = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)

      setSaveMessage('Quotation PDF downloaded successfully.')
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Could not download the quotation PDF. Please try again.',
      )
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  async function sendQuotationMailDraft() {
    if (!savedQuotationId || isCreatingMailDraft) return

    const email = contactEmail.trim()
    if (!email) {
      setSaveError('Please add the customer email address before creating an Outlook draft.')
      return
    }

    const contactNameValue = contactPerson.trim() || customerName.trim() || 'Customer'
    const categoryName =
      category === 'Airtime/Frequency' ? 'Airtime' : category || 'Quotation'
    const companyName = customerName.trim() || 'Customer'
    const quotationNumber = savedQuotationNumber || savedQuotationId
    const subject = `${categoryName} Quotation - ${companyName} - ${quotationNumber} | Airtech Solutions India Pvt. Ltd.`

    setIsCreatingMailDraft(true)
    setSaveError('')
    setSaveMessage('')

    try {
      const response = await fetch('http://127.0.0.1:8000/api/outlook/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation_id: savedQuotationId,
          recipient: email,
          subject,
          body: `Dear ${contactNameValue}, please see the attached quotation.`,
        }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          typeof result?.detail === 'string'
            ? result.detail
            : 'Could not create the Outlook draft.',
        )
      }

      setSaveMessage(
        'Outlook draft opened with the quotation PDF attached. Please review it before sending.',
      )
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Could not create the Outlook draft. Check that the backend and classic Outlook are available.',
      )
    } finally {
      setIsCreatingMailDraft(false)
    }
  }

  const lineCount = category === 'Rental' ? items.length : otherItemName.trim() ? 1 : 0
  const taxStepNumber = category === 'Rental' ? 5 : 4

  return (
    <div className="py-2">
      <div className="space-y-6">
        <header>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {showReview ? 'Review quotation' : 'Quotation details'}
          </h2>
          <p className="mt-1.5 max-w-xl text-slate-500">
            {showReview
              ? 'Check everything below, then save. You can go back and edit at any time before saving.'
              : 'Fill in the customer details, choose a category and add products. Totals update as you type.'}
          </p>
        </header>

        {showReview ? (
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">
                    {customerName} <span className="font-normal text-slate-400">·</span>{' '}
                    <span className="font-medium text-slate-600">{category}</span>
                  </CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    {savedQuotationId
                      ? 'This quotation is saved. You can now download the PDF.'
                      : 'Not saved yet. Nothing has been sent to the backend or Excel.'}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${savedQuotationId
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                    }`}
                >
                  {savedQuotationId ? 'Saved' : 'Unsaved draft'}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-6">
              {savedQuotationNumber && (
                <div
                  role="status"
                  className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                >
                  <p className="font-semibold">
                    Quotation {savedQuotationNumber} saved
                  </p>
                  <p className="mt-0.5">
                    {saveMessage || 'Your quotation is stored in Excel.'}
                  </p>
                </div>
              )}
              {saveError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <p className="font-semibold">Something went wrong</p>
                  <p className="mt-0.5">{saveError}</p>
                </div>
              )}

              <section>
                <h3 className="mb-4 text-sm font-semibold text-slate-900">
                  Customer and site
                </h3>
                <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <ReviewField label="Customer">
                    <span className="font-semibold">{customerName}</span>
                  </ReviewField>
                  <ReviewField label="Contact person">
                    {contactPerson || <Muted>Not provided</Muted>}
                  </ReviewField>
                  <ReviewField label="Email and phone">
                    <p>{contactEmail || <Muted>No email provided</Muted>}</p>
                    <p>{contactPhone || <Muted>No phone provided</Muted>}</p>
                  </ReviewField>
                  <ReviewField label="Customer address">
                    <p className="whitespace-pre-wrap">
                      {customerAddress || <Muted>Not provided</Muted>}
                    </p>
                  </ReviewField>
                  <ReviewField label="Site">
                    <p>{siteName || <Muted>Not provided</Muted>}</p>
                    <p className="whitespace-pre-wrap">
                      {siteAddress || <Muted>No site address provided</Muted>}
                    </p>
                  </ReviewField>
                  <ReviewField label="Date and validity">
                    <p>{quotationDate}</p>
                    <p className="text-slate-500">Valid for {validityDays} days</p>
                  </ReviewField>
                </div>
              </section>

              <section className="border-t border-slate-100 pt-6">
                {category === 'Rental' ? (
                  <>
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                      Rental items ({items.length})
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-medium">Product</th>
                            <th className="px-4 py-3 font-medium">Qty</th>
                            <th className="px-4 py-3 font-medium">Rate</th>
                            <th className="px-4 py-3 font-medium">Duration</th>
                            <th className="px-4 py-3 text-right font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 font-medium">{item.equipment}</td>
                              <td className="px-4 py-3">{item.quantity}</td>
                              <td className="px-4 py-3 tabular-nums">
                                {money(Number(item.rate) || 0)} / {item.rateUnit}
                              </td>
                              <td className="px-4 py-3">
                                {item.duration} {item.rateUnit}
                              </td>
                              <td className="px-4 py-3 text-right font-medium tabular-nums">
                                {money(itemAmount(item))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">
                      Product or service
                    </h3>
                    <div className="grid gap-x-8 gap-y-5 sm:grid-cols-3">
                      <ReviewField label="Item">
                        <span className="font-medium">{otherItemName}</span>
                      </ReviewField>
                      <ReviewField label="Quantity">{otherQuantity}</ReviewField>
                      <ReviewField label="Unit price">
                        <span className="tabular-nums">
                          {money(Number(otherUnitPrice) || 0)}
                        </span>
                      </ReviewField>
                      {category === 'Airtime/Frequency' && (
                        <div className="sm:col-span-3">
                          <ReviewField label="Airtime / frequency details">
                            <p className="whitespace-pre-wrap">{frequencyDetails}</p>
                          </ReviewField>
                        </div>
                      )}
                      {(category === 'CAMC' || category === 'NAMC') && (
                        <>
                          <ReviewField label="Contract period">
                            {contractMonths} months
                          </ReviewField>
                          <ReviewField label="Coverage">
                            {maintenanceCoverage}
                          </ReviewField>
                        </>
                      )}
                    </div>
                  </>
                )}
              </section>

              <div className="grid gap-8 border-t border-slate-100 pt-6 md:grid-cols-[1fr_340px]">
                <div>
                  {notes ? (
                    <>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Notes and commercial terms
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                        {notes}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">
                      No notes or commercial terms added.
                    </p>
                  )}
                </div>
                <div className="rounded-lg bg-slate-50 p-5">
                  <Totals
                    subtotal={subtotal}
                    taxType={taxType}
                    rate={validGstRate}
                    taxAmount={taxAmount}
                    grandTotal={grandTotal}
                  />
                </div>
              </div>

              <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReview(false)}
                >
                  Back to edit
                </Button>
                {!savedQuotationId ? (
                  <Button type="button" onClick={saveQuotation} disabled={isSaving}>
                    {isSaving ? 'Saving quotation…' : 'Save quotation to Excel'}
                  </Button>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={downloadQuotationPdf}
                      disabled={isDownloadingPdf}
                    >
                      {isDownloadingPdf ? 'Generating PDF…' : 'Download PDF'}
                    </Button>
                    <Button
                      type="button"
                      onClick={sendQuotationMailDraft}
                      disabled={isCreatingMailDraft}
                      className="gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      {isCreatingMailDraft ? 'Opening Outlook…' : 'Email quotation'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <form
              id="quotation-form"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <Card>
                <SectionHeader
                  step={1}
                  title="Customer and site"
                  description="Who the quotation is for and where the work happens."
                />
                <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
                  <Field
                    label="Customer / company name"
                    htmlFor="customerName"
                    required
                    className="sm:col-span-2"
                  >
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer or company name"
                      required
                    />
                  </Field>

                  <Field label="Contact person" htmlFor="contactPerson">
                    <Input
                      id="contactPerson"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Contact person name"
                    />
                  </Field>

                  <Field label="Contact phone" htmlFor="contactPhone">
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                  </Field>

                  <Field
                    label="Contact email"
                    htmlFor="contactEmail"
                    hint="Needed later if you want to email this quotation."
                    className="sm:col-span-2"
                  >
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="customer@example.com"
                    />
                  </Field>

                  <Field
                    label="Customer address"
                    htmlFor="customerAddress"
                    className="sm:col-span-2"
                  >
                    <Textarea
                      id="customerAddress"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Company billing address"
                      rows={2}
                    />
                  </Field>

                  <div className="border-t border-slate-100 pt-5 sm:col-span-2">
                    <p className="text-sm font-medium text-slate-900">
                      Site
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        Optional
                      </span>
                    </p>
                  </div>

                  <Field label="Site name" htmlFor="siteName">
                    <Input
                      id="siteName"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="Project or installation site"
                    />
                  </Field>

                  <Field label="Site address" htmlFor="siteAddress">
                    <Textarea
                      id="siteAddress"
                      value={siteAddress}
                      onChange={(e) => setSiteAddress(e.target.value)}
                      placeholder="Delivery or service location"
                      rows={2}
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card>
                <SectionHeader
                  step={2}
                  title="Quotation details"
                  description="Pick the category first. The next section adapts to it."
                />
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <p
                      id="category-label"
                      className="text-sm font-medium text-slate-700"
                    >
                      Quotation category<span className="ml-0.5 text-red-500">*</span>
                    </p>
                    <div
                      role="radiogroup"
                      aria-labelledby="category-label"
                      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      {categories.map((item) => {
                        const active = category === item
                        return (
                          <button
                            key={item}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setCategory(item)}
                            className={`rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${active
                                ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                              }`}
                          >
                            <span
                              className={`block text-sm font-semibold ${active ? 'text-blue-800' : 'text-slate-900'
                                }`}
                            >
                              {item}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {categoryHints[item]}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Quotation date" htmlFor="quotationDate" required>
                      <Input
                        id="quotationDate"
                        type="date"
                        value={quotationDate}
                        onChange={(e) => setQuotationDate(e.target.value)}
                        required
                      />
                    </Field>

                    <Field label="Validity (days)" htmlFor="validityDays" required>
                      <Input
                        id="validityDays"
                        type="number"
                        min="1"
                        value={validityDays}
                        onChange={(e) => setValidityDays(e.target.value)}
                        required
                      />
                    </Field>

                    <Field
                      label="Saved terms template"
                      htmlFor="termsTemplate"
                      hint="Optional. Select an Active template to include its saved terms in the quotation PDF."
                      className="sm:col-span-2"
                    >
                      <select
                        id="termsTemplate"
                        value={selectedTermsTemplateId}
                        onChange={(event) =>
                          setSelectedTermsTemplateId(event.target.value)
                        }
                        className={selectClass}
                      >
                        <option value="">No saved template</option>
                        {termsTemplates.map((template) => (
                          <option key={template.template_id} value={template.template_id}>
                            {template.name} — {template.company}
                            {template.include_in_pdf ? '' : ' (PDF inclusion disabled)'}
                          </option>
                        ))}
                      </select>

                      {termsTemplatesError && (
                        <p className="text-sm text-red-600" role="alert">
                          {termsTemplatesError}
                        </p>
                      )}

                      {!termsTemplatesError && termsTemplates.length === 0 && (
                        <p className="text-xs text-slate-500">
                          No Active templates available. Create and activate one on the Terms Templates page.
                        </p>
                      )}
                    </Field>
                  </div>
                </CardContent>
              </Card>

              {!category && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  Choose a category above to add products or services.
                </div>
              )}

              {category === 'Rental' && (
                <>
                  <Card>
                    <SectionHeader
                      step={3}
                      title="Add rental equipment"
                      description="Add one product at a time. It will appear in the table below, where you can still edit it."
                    />
                    <CardContent className="pt-6">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Field
                          label="Product / equipment name"
                          htmlFor="entryEquipment"
                          required
                          className="sm:col-span-2 lg:col-span-3"
                        >
                          <Input
                            id="entryEquipment"
                            value={entry.equipment}
                            onChange={(e) => updateEntry('equipment', e.target.value)}
                            placeholder="Equipment name or model"
                          />
                        </Field>

                        <Field label="Quantity" htmlFor="entryQuantity" required>
                          <Input
                            id="entryQuantity"
                            type="number"
                            min="1"
                            value={entry.quantity}
                            onChange={(e) => updateEntry('quantity', e.target.value)}
                          />
                        </Field>

                        <Field label="Rate unit" htmlFor="entryRateUnit" required>
                          <select
                            id="entryRateUnit"
                            value={entry.rateUnit}
                            onChange={(e) => updateEntry('rateUnit', e.target.value)}
                            className={selectClass}
                          >
                            <option value="Days">Per day</option>
                            <option value="Months">Per month</option>
                            <option value="Years">Per year</option>
                          </select>
                        </Field>

                        <Field
                          label={`Duration (${entry.rateUnit.toLowerCase()})`}
                          htmlFor="entryDuration"
                          required
                        >
                          <Input
                            id="entryDuration"
                            type="number"
                            min="1"
                            value={entry.duration}
                            onChange={(e) => updateEntry('duration', e.target.value)}
                          />
                        </Field>

                        <Field
                          label={`Rate per ${entry.rateUnit.toLowerCase().replace(/s$/, '')} (₹)`}
                          htmlFor="entryRate"
                          required
                        >
                          <Input
                            id="entryRate"
                            type="number"
                            min="0"
                            step="0.01"
                            value={entry.rate}
                            onChange={(e) => updateEntry('rate', e.target.value)}
                            placeholder="0.00"
                          />
                        </Field>

                        <Field label="Item amount">
                          <div className="flex h-10 items-center rounded-md bg-slate-100 px-3 font-semibold tabular-nums text-slate-900">
                            {money(itemAmount(entry))}
                          </div>
                        </Field>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            onClick={() => addItem()}
                            className="w-full"
                          >
                            + Add item
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <SectionHeader
                      step={4}
                      title={`Rental items${items.length ? ` (${items.length})` : ''}`}
                      description="Edit product, quantity, duration and rate directly in the table."
                    />
                    <CardContent className="space-y-4 pt-6">
                      {items.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                          <p className="font-medium text-slate-700">
                            No products added yet
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Fill in the form above and select “Add item”.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="w-full min-w-[950px] text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                              <tr>
                                <th className="px-3 py-3 font-medium">Product</th>
                                <th className="px-3 py-3 font-medium">Qty</th>
                                <th className="px-3 py-3 font-medium">Rate unit</th>
                                <th className="px-3 py-3 font-medium">Duration</th>
                                <th className="px-3 py-3 font-medium">Rate (₹)</th>
                                <th className="px-3 py-3 text-right font-medium">Amount</th>
                                <th className="px-3 py-3"><span className="sr-only">Actions</span></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {items.map((item) => (
                                <tr key={item.id} className="align-middle">
                                  <td className="p-2">
                                    <Input
                                      aria-label="Product name"
                                      value={item.equipment}
                                      onChange={(e) =>
                                        updateItem(item.id, 'equipment', e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      aria-label="Quantity"
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        updateItem(item.id, 'quantity', e.target.value)
                                      }
                                      className="w-20"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <select
                                      aria-label="Rate unit"
                                      value={item.rateUnit}
                                      onChange={(e) =>
                                        updateItem(item.id, 'rateUnit', e.target.value)
                                      }
                                      className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                                    >
                                      <option value="Days">Days</option>
                                      <option value="Months">Months</option>
                                      <option value="Years">Years</option>
                                    </select>
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      aria-label="Duration"
                                      type="number"
                                      min="1"
                                      value={item.duration}
                                      onChange={(e) =>
                                        updateItem(item.id, 'duration', e.target.value)
                                      }
                                      className="w-24"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      aria-label="Rate"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.rate}
                                      onChange={(e) =>
                                        updateItem(item.id, 'rate', e.target.value)
                                      }
                                      className="w-28"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                                    {money(itemAmount(item))}
                                  </td>
                                  <td className="p-2 text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                      onClick={() => removeItem(item.id)}
                                      aria-label={`Remove ${item.equipment || 'item'}`}
                                    >
                                      Remove
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {category && category !== 'Rental' && (
                <Card>
                  <SectionHeader
                    step={3}
                    title={`${category} details`}
                    description="Enter the product or service and its commercial details."
                  />
                  <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
                    <Field
                      label="Product / equipment / service"
                      htmlFor="otherItemName"
                      required
                      className="sm:col-span-2"
                    >
                      <Input
                        id="otherItemName"
                        value={otherItemName}
                        onChange={(e) => setOtherItemName(e.target.value)}
                        placeholder="Enter item or service"
                        required
                      />
                    </Field>

                    <Field label="Quantity" htmlFor="otherQuantity" required>
                      <Input
                        id="otherQuantity"
                        type="number"
                        min="1"
                        value={otherQuantity}
                        onChange={(e) => setOtherQuantity(e.target.value)}
                        required
                      />
                    </Field>

                    <Field label="Unit price (₹)" htmlFor="otherUnitPrice" required>
                      <Input
                        id="otherUnitPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={otherUnitPrice}
                        onChange={(e) => setOtherUnitPrice(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </Field>

                    {category === 'Airtime/Frequency' && (
                      <Field
                        label="Frequency / airtime details"
                        htmlFor="frequencyDetails"
                        required
                        className="sm:col-span-2"
                      >
                        <Textarea
                          id="frequencyDetails"
                          value={frequencyDetails}
                          onChange={(e) => setFrequencyDetails(e.target.value)}
                          placeholder="Enter frequency, airtime, period and related details"
                          rows={3}
                          required
                        />
                      </Field>
                    )}

                    {(category === 'CAMC' || category === 'NAMC') && (
                      <>
                        <Field
                          label="Contract period (months)"
                          htmlFor="contractMonths"
                          required
                        >
                          <Input
                            id="contractMonths"
                            type="number"
                            min="1"
                            value={contractMonths}
                            onChange={(e) => setContractMonths(e.target.value)}
                            required
                          />
                        </Field>

                        <Field label="Maintenance coverage" required>
                          <Select
                            value={maintenanceCoverage}
                            onValueChange={(value) =>
                              setMaintenanceCoverage(value ?? '')
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select coverage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Preventive maintenance">
                                Preventive maintenance
                              </SelectItem>
                              <SelectItem value="Parts and labour">
                                Parts and labour
                              </SelectItem>
                              <SelectItem value="Labour only">
                                Labour only
                              </SelectItem>
                              <SelectItem value="As per contract">
                                As per contract
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {category && (
                <Card>
                  <SectionHeader
                    step={taxStepNumber}
                    title="Tax"
                    description="Confirm the applicable GST rate before issuing a quotation."
                  />
                  <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
                    <Field label="GST rate (%)" htmlFor="gstRate" required>
                      <Input
                        id="gstRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={gstRate}
                        onChange={(e) => setGstRate(e.target.value)}
                        required
                      />
                    </Field>

                    <Field
                      label="Tax type"
                      required
                      hint="CGST + SGST for within-state supply, IGST for inter-state."
                    >
                      <Select
                        value={taxType}
                        onValueChange={(value) =>
                          setTaxType((value ?? 'CGST/SGST') as TaxType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CGST/SGST">CGST + SGST</SelectItem>
                          <SelectItem value="IGST">IGST</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </CardContent>
                </Card>
              )}
            </form>

            <aside className="lg:sticky lg:top-6">
              <Card>
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-base">Quotation summary</CardTitle>
                  <p className="text-sm text-slate-500">
                    {customerName.trim() || 'No customer yet'}
                    {category ? ` · ${category}` : ''}
                  </p>
                </CardHeader>
                <CardContent className="space-y-5 pt-5">
                  <p className="text-sm text-slate-500">
                    {lineCount === 0
                      ? 'No line items yet'
                      : `${lineCount} line item${lineCount === 1 ? '' : 's'}`}
                  </p>
                  <Totals
                    subtotal={subtotal}
                    taxType={taxType}
                    rate={validGstRate}
                    taxAmount={taxAmount}
                    grandTotal={grandTotal}
                  />
                  <div className="flex flex-col gap-2 pt-1">
                    <Button type="submit" form="quotation-form" className="w-full">
                      Review quotation
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetForm}
                      className="w-full text-slate-600"
                    >
                      Clear form
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateQuotation