
import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Mail,
  Phone,
  Search,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  LoaderCircle,
} from 'lucide-react'

const API_URL = 'http://127.0.0.1:8000/api/customers/'

type Customer = {
  customer_id: string
  company_name: string
  contact_person: string
  email: string
  phone: string
  address: string
  gst_number: string
}

type CustomerForm = Omit<Customer, 'customer_id'>

const emptyForm: CustomerForm = {
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  gst_number: '',
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CustomerForm>(emptyForm)

  async function loadCustomers() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(API_URL)
      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? 'Customer API is not available yet. We need to add the backend.'
            : `Could not load customers (${response.status}).`,
        )
      }
      const data = await response.json()
      setCustomers(Array.isArray(data) ? data : data.customers ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load customers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCustomers()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return customers
    return customers.filter((customer) =>
      [
        customer.company_name,
        customer.contact_person,
        customer.email,
        customer.phone,
        customer.gst_number,
      ].some((value) => (value || '').toLowerCase().includes(query)),
    )
  }, [customers, search])

  function openNewCustomer() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  function openEditCustomer(customer: Customer) {
    setEditingId(customer.customer_id)
    setForm({
      company_name: customer.company_name || '',
      contact_person: customer.contact_person || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      gst_number: customer.gst_number || '',
    })
    setError('')
    setModalOpen(true)
  }

  async function saveCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch(
        editingId ? `${API_URL}${editingId}` : API_URL,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        },
      )

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.detail || `Save failed (${response.status}).`)
      }

      setModalOpen(false)
      await loadCustomers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save customer.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCustomer(customer: Customer) {
    if (!window.confirm(`Delete ${customer.company_name}?`)) return

    setError('')
    try {
      const response = await fetch(
        `${API_URL}${customer.customer_id}`,
        { method: 'DELETE' },
      )
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.detail || `Delete failed (${response.status}).`)
      }

      await loadCustomers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete customer.')
    }
  }

  function field(
    name: keyof CustomerForm,
    label: string,
    type = 'text',
  ) {
    return (
      <label className="block" key={name}>
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </span>
        <input
          type={type}
          required={name === 'company_name'}
          value={form[name]}
          onChange={(event) =>
            setForm({ ...form, [name]: event.target.value })
          }
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Customer management
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer contacts and prepare for service ticket tracking.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void loadCustomers()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={openNewCustomer}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} /> Add Customer
          </button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total customers</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {customers.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Customers with email</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {customers.filter((customer) => customer.email).length}
          </p>
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-900">Customer directory</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filtered.length} customer(s)
            </p>
          </div>
          <label className="relative block sm:w-80">
            <Search size={17} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </label>
        </div>

        {loading ? (
          <div className="flex justify-center gap-2 p-12 text-slate-500">
            <LoaderCircle className="animate-spin" size={18} />
            Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto text-slate-400" size={34} />
            <h3 className="mt-3 font-semibold text-slate-800">
              {customers.length ? 'No matching customers' : 'No customers yet'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Add your first customer to get started.
            </p>
            {!customers.length && (
              <button onClick={openNewCustomer} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                Add Customer
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((customer) => (
              <article
                key={customer.customer_id}
                className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">
                      {customer.company_name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {customer.contact_person || 'Contact not added'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      {customer.email && <span className="flex items-center gap-1"><Mail size={13} />{customer.email}</span>}
                      {customer.phone && <span className="flex items-center gap-1"><Phone size={13} />{customer.phone}</span>}
                    </div>
                    {customer.address && <p className="mt-1 text-xs text-slate-500">{customer.address}</p>}
                    {customer.gst_number && <p className="mt-1 text-xs text-slate-400">GST: {customer.gst_number}</p>}
                  </div>
                </div>

                <div className="flex gap-2 pl-14 sm:pl-0">
                  <button onClick={() => openEditCustomer(customer)} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium">
                    <Pencil size={14} /> Edit
                  </button>
                  <button onClick={() => void deleteCustomer(customer)} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModalOpen(false)
          }}
        >
          <section role="dialog" aria-modal="true" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Edit customer' : 'Add customer'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">Customer contact details</p>
              </div>
              <button onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveCustomer} className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {field('company_name', 'Company name *')}
                {field('contact_person', 'Contact person')}
                {field('email', 'Email', 'email')}
                {field('phone', 'Phone')}
                {field('gst_number', 'GST number')}
                <div className="sm:col-span-2">
                  {field('address', 'Address')}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">
                  Cancel
                </button>
                <button disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {saving ? 'Saving...' : editingId ? 'Save changes' : 'Save customer'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
