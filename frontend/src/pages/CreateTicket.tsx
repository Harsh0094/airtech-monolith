
import { useState } from 'react'
import {
  ClipboardPlus,
  Save,
  RotateCcw,
  UserRound,
  Wrench,
} from 'lucide-react'

type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'

type CreateTicketProps = {
  onCancel?: () => void
  onCreate?: (ticket: {
    subject: string
    customer: string
    email: string
    phone: string
    category: string
    priority: TicketPriority
    description: string
    assignedTo: string
  }) => void
}

const initialForm = {
  subject: '',
  customer: '',
  email: '',
  phone: '',
  category: 'Equipment Breakdown',
  priority: 'Medium' as TicketPriority,
  description: '',
  assignedTo: '',
}

const categories = [
  'Equipment Breakdown',
  'Repair',
  'Maintenance',
  'Network Issue',
  'Battery Issue',
  'General Support',
  'Billing',
]

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

export default function CreateTicket({
  onCancel,
  onCreate,
}: CreateTicketProps) {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    if (error) setError('')
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (
      !form.subject.trim() ||
      !form.customer.trim() ||
      !form.description.trim()
    ) {
      setError('Please complete the subject, customer name, and description.')
      return
    }

    if (!onCreate) {
      setError('Ticket saving is not connected yet.')
      return
    }

    onCreate({
      ...form,
      subject: form.subject.trim(),
      customer: form.customer.trim(),
      description: form.description.trim(),
    })
  }

  function resetForm() {
    setForm(initialForm)
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Compact heading */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
          <ClipboardPlus size={21} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Ticket information</h3>
          <p className="text-xs text-slate-500">
            Enter the issue and customer details. * Required fields.
          </p>
        </div>
      </div>

      {/* Two-column form */}
      <div className="grid grid-cols-1 gap-x-5 gap-y-3 md:grid-cols-2">
        {/* Issue details */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Wrench size={16} className="text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Issue details
            </h4>
          </div>

          <Field label="Ticket subject *">
            <input
              required
              value={form.subject}
              onChange={(e) => updateField('subject', e.target.value)}
              placeholder="e.g. Radio not transmitting"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category *">
              <select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                className={inputClass}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Priority *">
              <select
                value={form.priority}
                onChange={(e) => updateField('priority', e.target.value)}
                className={inputClass}
              >
                {(['Low', 'Medium', 'High', 'Urgent'] as const).map(
                  (priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ),
                )}
              </select>
            </Field>
          </div>

          <Field label="Issue description *">
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe the problem, equipment model, symptoms..."
              className={`${inputClass} resize-y`}
            />
          </Field>
        </section>

        {/* Customer details */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <UserRound size={16} className="text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Customer details
            </h4>
          </div>

          <Field label="Customer / Company *">
            <input
              required
              value={form.customer}
              onChange={(e) => updateField('customer', e.target.value)}
              placeholder="Company or customer name"
              className={inputClass}
            />
          </Field>

          <Field label="Contact email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="customer@example.com"
              className={inputClass}
            />
          </Field>

          <Field label="Contact phone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="Phone number"
              className={inputClass}
            />
          </Field>

          <Field label="Assigned staff member">
            <input
              value={form.assignedTo}
              onChange={(e) => updateField('assignedTo', e.target.value)}
              placeholder="Staff name (optional)"
              className={inputClass}
            />
          </Field>
        </section>
      </div>

      {/* Validation message */}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          {error}
        </p>
      )}

      {/* Compact action footer */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <RotateCcw size={15} />
          Reset
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Save size={15} />
            Create Ticket
          </button>
        </div>
      </footer>
    </form>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  )
}
