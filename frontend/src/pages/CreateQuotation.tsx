
import { useState } from 'react'
import type { FormEvent } from 'react'
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

  const [items, setItems] = useState<QuotationItem[]>([])
  const [nextItemId, setNextItemId] = useState(1)
  const [entry, setEntry] = useState<QuotationItem>(() => emptyItem(0))

  const [gstRate, setGstRate] = useState('18')
  const [taxType, setTaxType] = useState<TaxType>('CGST/SGST')
  const [showReview, setShowReview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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

  function downloadQuotationPdf() {
    setSaveError('')
    setSaveMessage('PDF coming soon. Your quotation is saved safely.')
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm font-semibold tracking-widest text-blue-600">
            AIRTECH WORKSPACE
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Create Quotation
          </h1>
          <p className="mt-2 text-slate-500">
            Complete the customer details, add products and review the quotation.
          </p>
        </header>

        {showReview ? (
          <Card>
            <CardHeader>
              <CardTitle>Quotation review</CardTitle>
              <p className="text-sm text-slate-500">
                Review the information before proceeding. This draft has not
                been saved to the backend or Excel.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {savedQuotationNumber && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  <p className="font-semibold">Quotation saved: {savedQuotationNumber}</p>
                  <p>{saveMessage || 'Your quotation is stored in Excel.'}</p>
                </div>
              )}
              {saveError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {saveError}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Customer</p>
                  <p className="font-semibold">{customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Category</p>
                  <p className="font-semibold">{category}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Contact person</p>
                  <p>{contactPerson || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email / phone</p>
                  <p>{contactEmail || 'No email provided'}</p>
                  <p>{contactPhone || 'No phone provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Customer address</p>
                  <p>{customerAddress || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Site</p>
                  <p>{siteName || 'Not provided'}</p>
                  <p>{siteAddress || 'No site address provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Quotation date</p>
                  <p>{quotationDate}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Validity</p>
                  <p>{validityDays} days</p>
                </div>
              </div>

              {category === 'Rental' ? (
                <div className="space-y-3">
                  <h3 className="font-semibold">Rental items</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead className="border-b text-slate-500">
                        <tr>
                          <th className="py-3 pr-3">Product</th>
                          <th className="py-3 pr-3">Qty</th>
                          <th className="py-3 pr-3">Rate</th>
                          <th className="py-3 pr-3">Duration</th>
                          <th className="py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-3 pr-3">{item.equipment}</td>
                            <td className="py-3 pr-3">{item.quantity}</td>
                            <td className="py-3 pr-3">
                              {money(Number(item.rate) || 0)} / {item.rateUnit}
                            </td>
                            <td className="py-3 pr-3">
                              {item.duration} {item.rateUnit}
                            </td>
                            <td className="py-3 text-right">
                              {money(itemAmount(item))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="font-semibold">Product / service details</h3>
                  <p>{otherItemName}</p>
                  <p>Quantity: {otherQuantity}</p>
                  <p>Unit price: {money(Number(otherUnitPrice) || 0)}</p>

                  {category === 'Airtime/Frequency' && (
                    <div>
                      <p className="font-medium">Airtime / frequency</p>
                      <p className="whitespace-pre-wrap text-sm">
                        {frequencyDetails}
                      </p>
                    </div>
                  )}

                  {(category === 'CAMC' || category === 'NAMC') && (
                    <p className="text-sm">
                      Contract: {contractMonths} months. Coverage:{' '}
                      {maintenanceCoverage}
                    </p>
                  )}
                </div>
              )}

              <div className="ml-auto max-w-sm space-y-3 border-t pt-4">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>

                {taxType === 'IGST' ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      IGST ({validGstRate}%)
                    </span>
                    <span>{money(taxAmount)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        CGST ({validGstRate / 2}%)
                      </span>
                      <span>{money(taxAmount / 2)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        SGST ({validGstRate / 2}%)
                      </span>
                      <span>{money(taxAmount / 2)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between gap-4 border-t pt-3">
                  <span className="font-bold">Grand total</span>
                  <span className="text-xl font-bold text-blue-700">
                    {money(grandTotal)}
                  </span>
                </div>
              </div>

              {notes && (
                <div>
                  <h3 className="font-semibold">Notes and commercial terms</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{notes}</p>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReview(false)}
                >
                  Back to edit
                </Button>
                {!savedQuotationId ? (
                  <Button type="button" onClick={saveQuotation} disabled={isSaving}>
                    {isSaving ? 'Saving quotation…' : 'Save Quotation to Excel'}
                  </Button>
                ) : (
                  <Button type="button" onClick={downloadQuotationPdf}>
                    PDF Coming Soon
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Customer and site details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="customerName" className="text-sm font-medium">
                    Customer / company name *
                  </label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer or company name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="contactPerson" className="text-sm font-medium">
                    Contact person
                  </label>
                  <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Contact person name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="contactEmail" className="text-sm font-medium">
                    Contact email
                  </label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="customer@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="contactPhone" className="text-sm font-medium">
                    Contact phone
                  </label>
                  <Input
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="customerAddress" className="text-sm font-medium">
                    Customer address
                  </label>
                  <Textarea
                    id="customerAddress"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Company billing address"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="siteName" className="text-sm font-medium">
                    Site name
                  </label>
                  <Input
                    id="siteName"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Project or installation site"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="siteAddress" className="text-sm font-medium">
                    Site address
                  </label>
                  <Textarea
                    id="siteAddress"
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    placeholder="Delivery or service location"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Quotation details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Quotation category *
                  </label>
                  <Select
                    value={category}
                    onValueChange={(value) =>
                      setCategory((value ?? '') as Category | '')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="quotationDate" className="text-sm font-medium">
                    Quotation date *
                  </label>
                  <Input
                    id="quotationDate"
                    type="date"
                    value={quotationDate}
                    onChange={(e) => setQuotationDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="validityDays" className="text-sm font-medium">
                    Validity (days) *
                  </label>
                  <Input
                    id="validityDays"
                    type="number"
                    min="1"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="notes" className="text-sm font-medium">
                    Notes and commercial terms
                  </label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Payment, delivery, warranty and other terms"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {category === 'Rental' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>3. Add rental equipment</CardTitle>
                    <p className="text-sm text-slate-500">
                      Add one product at a time. Each product will appear in the
                      editable table below.
                    </p>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                        <label htmlFor="entryEquipment" className="text-sm font-medium">
                          Product / equipment name *
                        </label>
                        <Input
                          id="entryEquipment"
                          value={entry.equipment}
                          onChange={(e) => updateEntry('equipment', e.target.value)}
                          placeholder="Equipment name or model"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="entryQuantity" className="text-sm font-medium">
                          Quantity *
                        </label>
                        <Input
                          id="entryQuantity"
                          type="number"
                          min="1"
                          value={entry.quantity}
                          onChange={(e) => updateEntry('quantity', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="entryRateUnit" className="text-sm font-medium">
                          Rate unit *
                        </label>
                        <select
                          id="entryRateUnit"
                          value={entry.rateUnit}
                          onChange={(e) => updateEntry('rateUnit', e.target.value)}
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="Days">Per day</option>
                          <option value="Months">Per month</option>
                          <option value="Years">Per year</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="entryDuration" className="text-sm font-medium">
                          Duration ({entry.rateUnit.toLowerCase()}) *
                        </label>
                        <Input
                          id="entryDuration"
                          type="number"
                          min="1"
                          value={entry.duration}
                          onChange={(e) => updateEntry('duration', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="entryRate" className="text-sm font-medium">
                          Rate per {entry.rateUnit.toLowerCase()} (₹) *
                        </label>
                        <Input
                          id="entryRate"
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry.rate}
                          onChange={(e) => updateEntry('rate', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Item amount</label>
                        <div className="flex h-10 items-center rounded-md bg-slate-100 px-3 font-semibold">
                          {money(itemAmount(entry))}
                        </div>
                      </div>

                      <div className="flex items-end">
                        <Button type="button" onClick={() => addItem()}>
                          + Add Item
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>4. Rental items table</CardTitle>
                    <p className="text-sm text-slate-500">
                      Edit product, quantity, duration and rate directly in the table.
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {items.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-500">
                        No products added yet. Add a product using the form above.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px] text-left text-sm">
                          <thead className="border-b bg-slate-100 text-slate-600">
                            <tr>
                              <th className="p-3">Product</th>
                              <th className="p-3">Qty</th>
                              <th className="p-3">Rate unit</th>
                              <th className="p-3">Duration</th>
                              <th className="p-3">Rate (₹)</th>
                              <th className="p-3 text-right">Amount</th>
                              <th className="p-3">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => (
                              <tr key={item.id} className="border-b align-middle">
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
                                    className="h-10 rounded-md border border-input bg-background px-2"
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
                                <td className="p-3 text-right font-semibold">
                                  {money(itemAmount(item))}
                                </td>
                                <td className="p-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => removeItem(item.id)}
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

                    <div className="ml-auto max-w-sm space-y-3 border-t pt-4">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Subtotal</span>
                        <span>{money(rentalSubtotal)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {category && category !== 'Rental' && (
              <Card>
                <CardHeader>
                  <CardTitle>3. {category} details</CardTitle>
                  <p className="text-sm text-slate-500">
                    Enter the product or service and its commercial details.
                  </p>
                </CardHeader>

                <CardContent className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="otherItemName" className="text-sm font-medium">
                      Product / equipment / service *
                    </label>
                    <Input
                      id="otherItemName"
                      value={otherItemName}
                      onChange={(e) => setOtherItemName(e.target.value)}
                      placeholder="Enter item or service"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="otherQuantity" className="text-sm font-medium">
                      Quantity *
                    </label>
                    <Input
                      id="otherQuantity"
                      type="number"
                      min="1"
                      value={otherQuantity}
                      onChange={(e) => setOtherQuantity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="otherUnitPrice" className="text-sm font-medium">
                      Unit price (₹) *
                    </label>
                    <Input
                      id="otherUnitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={otherUnitPrice}
                      onChange={(e) => setOtherUnitPrice(e.target.value)}
                      required
                    />
                  </div>

                  {category === 'Airtime/Frequency' && (
                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="frequencyDetails" className="text-sm font-medium">
                        Frequency / airtime details *
                      </label>
                      <Textarea
                        id="frequencyDetails"
                        value={frequencyDetails}
                        onChange={(e) => setFrequencyDetails(e.target.value)}
                        placeholder="Enter frequency, airtime, period and related details"
                        rows={3}
                        required
                      />
                    </div>
                  )}

                  {(category === 'CAMC' || category === 'NAMC') && (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="contractMonths" className="text-sm font-medium">
                          Contract period (months) *
                        </label>
                        <Input
                          id="contractMonths"
                          type="number"
                          min="1"
                          value={contractMonths}
                          onChange={(e) => setContractMonths(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Maintenance coverage *
                        </label>
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
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>
                  {category === 'Rental' ? '5. Tax and quotation total' : '4. Tax and quotation total'}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="gstRate" className="text-sm font-medium">
                      GST rate (%) *
                    </label>
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tax type *</label>
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
                  </div>
                </div>

                <div className="ml-auto max-w-sm space-y-3 border-t pt-4">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>

                  {taxType === 'IGST' ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        IGST ({validGstRate}%)
                      </span>
                      <span>{money(taxAmount)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">
                          CGST ({validGstRate / 2}%)
                        </span>
                        <span>{money(taxAmount / 2)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">
                          SGST ({validGstRate / 2}%)
                        </span>
                        <span>{money(taxAmount / 2)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between gap-4 border-t pt-3">
                    <span className="font-bold">Grand total</span>
                    <span className="text-xl font-bold text-blue-700">
                      {money(grandTotal)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Tax is calculated for this draft using the entered GST rate.
                  Confirm the applicable rate before issuing a quotation.
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" onClick={resetForm}>
                Clear form
              </Button>
              <Button type="submit">Review quotation</Button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

export default CreateQuotation
