
import { useState } from 'react'
import {
  ClipboardList,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  SlidersHorizontal,
  Building2,
  CalendarDays,
  Wrench,
  UserRound,
} from 'lucide-react'
import CreateTicket from './CreateTicket'

type TicketStatus = 'Open' | 'In Progress' | 'Waiting' | 'Resolved'
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'

type Ticket = {
  ticket_id: string
  subject: string
  customer: string
  category: string
  priority: TicketPriority
  status: TicketStatus
  email?: string
  phone?: string
  description?: string
  assignedTo?: string
  createdAt: string
}

type NewTicket = {
  subject: string
  customer: string
  email: string
  phone: string
  category: string
  priority: TicketPriority
  description: string
  assignedTo: string
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

const statuses: Array<'All' | TicketStatus> = [
  'All',
  'Open',
  'In Progress',
  'Waiting',
  'Resolved',
]

const priorities: Array<'All' | TicketPriority> = [
  'All',
  'Low',
  'Medium',
  'High',
  'Urgent',
]

const selectClass =
  'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

export default function ServiceMaintenance() {
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Temporary sample data. Backend storage will be connected later.
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      ticket_id: 'AT-TKT-0001',
      subject: 'Walkie-talkie not transmitting',
      customer: 'Sample Customer Ltd',
      category: 'Equipment Breakdown',
      priority: 'High',
      status: 'Open',
      description: 'Device powers on but cannot transmit.',
      assignedTo: 'Service Team',
      createdAt: new Date().toISOString(),
    },
    {
      ticket_id: 'AT-TKT-0002',
      subject: 'Battery replacement request',
      customer: 'Example Industries',
      category: 'Maintenance',
      priority: 'Medium',
      status: 'In Progress',
      description: 'Customer has requested a battery replacement.',
      assignedTo: 'Service Team',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ])

  // Client options are built from all tickets, not just filtered results.
  const clients = [
    ...new Set(
      tickets
        .map((ticket) => ticket.customer.trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b))

  function handleCreateTicket(form: NewTicket) {
    const newTicket: Ticket = {
      ticket_id: `AT-TKT-${String(Date.now()).slice(-6)}`,
      subject: form.subject,
      customer: form.customer.trim(),
      category: form.category,
      priority: form.priority,
      status: 'Open',
      email: form.email,
      phone: form.phone,
      description: form.description,
      assignedTo: form.assignedTo,
      createdAt: new Date().toISOString(),
    }

    setTickets((currentTickets) => [newTicket, ...currentTickets])
    setSearch('')
    setClientFilter('All')
    setCategoryFilter('All')
    setPriorityFilter('All')
    setStatusFilter('All')
    setShowCreateForm(false)
  }

  const visibleTickets = tickets.filter((ticket) => {
    const searchTerm = search.trim().toLowerCase()

    const matchesSearch = [
      ticket.ticket_id,
      ticket.subject,
      ticket.customer,
      ticket.category,
      ticket.assignedTo ?? '',
      ticket.email ?? '',
    ].some((value) => value.toLowerCase().includes(searchTerm))

    const matchesClient =
      clientFilter === 'All' || ticket.customer.trim() === clientFilter

    const matchesCategory =
      categoryFilter === 'All' || ticket.category === categoryFilter

    const matchesPriority =
      priorityFilter === 'All' || ticket.priority === priorityFilter

    const matchesStatus =
      statusFilter === 'All' || ticket.status === statusFilter

    return (
      matchesSearch &&
      matchesClient &&
      matchesCategory &&
      matchesPriority &&
      matchesStatus
    )
  })

  const count = (status: TicketStatus) =>
    tickets.filter((ticket) => ticket.status === status).length

  const activeFilterCount = [
    clientFilter !== 'All',
    categoryFilter !== 'All',
    priorityFilter !== 'All',
    statusFilter !== 'All',
  ].filter(Boolean).length

  function resetFilters() {
    setSearch('')
    setClientFilter('All')
    setCategoryFilter('All')
    setPriorityFilter('All')
    setStatusFilter('All')
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <>
      <main className="mx-auto w-full max-w-7xl space-y-6">
        {/* Page header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Airtech Service Desk
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Support Tickets
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage customer issues, equipment repairs and service requests.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={17} />
            Raise Ticket
          </button>
        </header>

        {/* Summary cards */}
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            {
              label: 'Open',
              value: count('Open'),
              icon: AlertCircle,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              label: 'In Progress',
              value: count('In Progress'),
              icon: Clock,
              color: 'text-violet-600',
              bg: 'bg-violet-50',
            },
            {
              label: 'Waiting',
              value: count('Waiting'),
              icon: ClipboardList,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
            {
              label: 'Resolved',
              value: count('Resolved'),
              icon: CheckCircle2,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
            },
          ].map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-slate-500">
                    {item.label} tickets
                  </p>
                  <span className={`rounded-lg p-2 ${item.bg} ${item.color}`}>
                    <Icon size={18} />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {item.value}
                </p>
              </div>
            )
          })}
        </section>

        {/* Ticket register */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-4 border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-slate-900">
                    Ticket register
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {visibleTickets.length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Search by client or issue, or combine filters to narrow results.
                </p>
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="self-start text-sm font-medium text-blue-600 hover:text-blue-800 sm:self-auto"
                >
                  Clear filters ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Search */}
            <label className="relative block">
              <Search
                size={17}
                className="absolute left-3 top-3 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ticket ID, issue, client, email or staff..."
                aria-label="Search tickets and clients"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            {/* Filters */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label
                  htmlFor="client-filter"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500"
                >
                  <UserRound size={14} />
                  Client
                </label>
                <select
                  id="client-filter"
                  value={clientFilter}
                  onChange={(event) => setClientFilter(event.target.value)}
                  className={selectClass}
                >
                  <option value="All">All clients</option>
                  {clients.map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="category-filter"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500"
                >
                  <Wrench size={14} />
                  Category
                </label>
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className={selectClass}
                >
                  <option value="All">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="priority-filter"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500"
                >
                  <SlidersHorizontal size={14} />
                  Priority
                </label>
                <select
                  id="priority-filter"
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                  className={selectClass}
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority === 'All' ? 'All priorities' : priority}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="status-filter"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500"
                >
                  <ClipboardList size={14} />
                  Status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className={selectClass}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status === 'All' ? 'All statuses' : status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Reset search & filters
              </button>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ticket / Issue
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Client
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Priority
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {visibleTickets.map((ticket) => (
                  <tr
                    key={ticket.ticket_id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-blue-600">
                        {ticket.ticket_id}
                      </p>
                      <p className="mt-1 max-w-xs font-semibold text-slate-900">
                        {ticket.subject}
                      </p>
                      {ticket.assignedTo && (
                        <p className="mt-1 text-xs text-slate-500">
                          Assigned: {ticket.assignedTo}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Building2
                          size={16}
                          className="shrink-0 text-slate-400"
                        />
                        <span className="text-sm font-medium text-slate-700">
                          {ticket.customer}
                        </span>
                      </div>
                      {ticket.email && (
                        <p className="mt-1 pl-6 text-xs text-slate-500">
                          {ticket.email}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600">
                        {ticket.category}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-500">
                        <CalendarDays size={14} />
                        {formatDate(ticket.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 p-3 md:hidden">
            {visibleTickets.map((ticket) => (
              <article
                key={ticket.ticket_id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-blue-600">
                      {ticket.ticket_id}
                    </p>
                    <h3 className="mt-1 break-words font-semibold text-slate-900">
                      {ticket.subject}
                    </h3>
                  </div>
                  <PriorityBadge priority={ticket.priority} />
                </div>

                <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                  <Building2
                    size={16}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />
                  <div className="min-w-0 break-words">
                    <p>{ticket.customer}</p>
                    {ticket.email && (
                      <p className="mt-1 text-xs text-slate-500">
                        {ticket.email}
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {ticket.category}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <StatusBadge status={ticket.status} />
                  <span className="text-xs text-slate-500">
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>

                {ticket.assignedTo && (
                  <p className="mt-2 text-xs text-slate-500">
                    Assigned to: {ticket.assignedTo}
                  </p>
                )}
              </article>
            ))}
          </div>

          {/* Empty state */}
          {visibleTickets.length === 0 && (
            <div className="p-10 text-center">
              <ClipboardList
                size={38}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 font-semibold text-slate-800">
                No tickets found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                No tickets match this client, search or filter combination.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Create Ticket Modal */}
      {showCreateForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowCreateForm(false)
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-ticket-title"
            className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
              <div>
                <h2
                  id="create-ticket-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Raise a Support Ticket
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Record a customer issue or service request.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                aria-label="Close create ticket modal"
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={21} />
              </button>
            </div>

            <div className="p-5 sm:p-7">
              <CreateTicket
                onCancel={() => setShowCreateForm(false)}
                onCreate={handleCreateTicket}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const classes: Record<TicketPriority, string> = {
    Low: 'bg-slate-100 text-slate-700',
    Medium: 'bg-amber-50 text-amber-700',
    High: 'bg-orange-50 text-orange-700',
    Urgent: 'bg-red-50 text-red-700',
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${classes[priority]}`}
    >
      {priority}
    </span>
  )
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const classes: Record<TicketStatus, string> = {
    Open: 'bg-blue-50 text-blue-700',
    'In Progress': 'bg-violet-50 text-violet-700',
    Waiting: 'bg-amber-50 text-amber-700',
    Resolved: 'bg-emerald-50 text-emerald-700',
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status]}`}
    >
      {status}
    </span>
  )
}
