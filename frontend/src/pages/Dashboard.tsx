
import { useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FilePlus2,
  FileText,
  IndianRupee,
  Package,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react'

type Role = 'admin' | 'finance' | 'employee'
type Period = 'monthly' | 'yearly'

const demoFinancials = {
  monthly: {
    sales: 845000,
    expenses: 326000,
    profit: 519000,
    received: 612000,
    outstanding: 233000,
    quotations: 42,
  },
  yearly: {
    sales: 8640000,
    expenses: 3280000,
    profit: 5360000,
    received: 7190000,
    outstanding: 1450000,
    quotations: 386,
  },
}

const activities = [
  {
    title: 'Quotation sent',
    detail: 'QT-2026-014 · ABC Communications',
    by: 'Sales Team',
    time: '10:30 AM',
    type: 'Quotation',
    icon: FileText,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    title: 'Customer updated',
    detail: 'XYZ Networks · Contact information',
    by: 'Admin',
    time: '10:12 AM',
    type: 'Customer',
    icon: Users,
    color: 'text-violet-600 bg-violet-50',
  },
  {
    title: 'Inventory updated',
    detail: 'Handheld radio · Stock adjustment',
    by: 'Inventory Team',
    time: '9:45 AM',
    type: 'Inventory',
    icon: Package,
    color: 'text-teal-600 bg-teal-50',
  },
  {
    title: 'Payment recorded',
    detail: 'INV-2026-008 · ₹45,000',
    by: 'Finance Team',
    time: '9:20 AM',
    type: 'Finance',
    icon: Wallet,
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    title: 'Service case updated',
    detail: 'SR-2026-021 · Radio maintenance',
    by: 'Service Team',
    time: 'Yesterday',
    type: 'Service',
    icon: Wrench,
    color: 'text-orange-600 bg-orange-50',
  },
]

const demoTasks = [
  {
    title: 'Prepare customer quotation',
    detail: 'ABC Communications · Outright Sale',
    due: 'Due today',
    status: 'In progress',
    shared: false,
  },
  {
    title: 'Follow up on quotation',
    detail: 'QT-2026-011 · XYZ Networks',
    due: 'Due today',
    status: 'Pending',
    shared: false,
  },
  {
    title: 'Check low-stock radio units',
    detail: 'Inventory · Shared company task',
    due: 'Due today',
    status: 'Pending',
    shared: true,
  },
  {
    title: 'Review maintenance request',
    detail: 'SR-2026-021 · Shared company task',
    due: 'Tomorrow',
    status: 'Open',
    shared: true,
  },
]

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)

function Dashboard() {
  const [role, setRole] = useState<Role>('admin')
  const [period, setPeriod] = useState<Period>('monthly')
  const [activityFilter, setActivityFilter] = useState('All')

  const financial = demoFinancials[period]
  const canSeeFinancials = role === 'admin' || role === 'finance'

  const financialCards = [
    {
      title: 'Total Sales',
      value: formatMoney(financial.sales),
      description: 'Recorded sales for this period',
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Total Expenses',
      value: formatMoney(financial.expenses),
      description: 'Recorded business expenses',
      icon: ArrowDownRight,
      color: 'text-rose-600 bg-rose-50',
    },
    {
      title: 'Net Profit',
      value: formatMoney(financial.profit),
      description: 'Sales minus recorded expenses',
      icon: IndianRupee,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Payments Received',
      value: formatMoney(financial.received),
      description: 'Customer payments recorded',
      icon: Wallet,
      color: 'text-violet-600 bg-violet-50',
    },
    {
      title: 'Outstanding Payments',
      value: formatMoney(financial.outstanding),
      description: 'Outstanding customer invoices',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Total Quotations',
      value: String(financial.quotations),
      description: 'Quotations created this period',
      icon: FileText,
      color: 'text-sky-600 bg-sky-50',
    },
  ]

  const visibleActivities = activities.filter((item) => {
    if (role === 'employee' && item.type === 'Finance') return false
    return activityFilter === 'All' || item.type === activityFilter
  })

  const navigationItems = [
    { label: 'Quotations', description: 'Create and track customer quotes', icon: FileText },
    { label: 'Customers', description: 'Customer records and follow-ups', icon: Users },
    { label: 'Products & Inventory', description: 'Stock levels and product updates', icon: Package },
    { label: 'Orders', description: 'Open and completed orders', icon: ClipboardList },
    { label: 'Service & Maintenance', description: 'Service requests and damage reports', icon: Wrench },
    ...(canSeeFinancials
      ? [{ label: 'Finance & Reports', description: 'Financial summaries and reports', icon: Wallet }]
      : []),
  ]

  const openQuotation = () => {
    window.dispatchEvent(new Event('airtech:create-quotation'))
  }

  const navigate = (page: string) => {
    if (page === 'Finance & Reports') {
      window.dispatchEvent(
        new CustomEvent('airtech:navigate', { detail: { page: 'Reports' } }),
      )
      return
    }

    window.dispatchEvent(
      new CustomEvent('airtech:navigate', { detail: { page } }),
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 pb-8">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Demo preview:</strong> All figures, tasks, and activities on
        this page are sample data, not actual Airtech business records.
      </div>

      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Airtech Business Management
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {role === 'employee'
              ? 'My Work Dashboard'
              : role === 'finance'
                ? 'Finance Dashboard'
                : 'Admin Dashboard'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {role === 'employee'
              ? 'See your tasks and shared company work.'
              : role === 'finance'
                ? 'Review company financial performance and business activity.'
                : 'Monitor company performance and business operations.'}
          </p>
        </div>

        <button
          onClick={openQuotation}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <FilePlus2 size={18} />
          Create Quotation
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-semibold text-slate-900">Preview Dashboard Roles</h3>
            <p className="mt-1 text-sm text-slate-500">
              Switch views to see what each type of user would see.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              ['admin', 'Admin', ShieldCheck],
              ['finance', 'Finance Staff', Wallet],
              ['employee', 'Employee', BriefcaseBusiness],
            ] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                onClick={() => setRole(value)}
                aria-pressed={role === value}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                  role === value
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          {role === 'admin'
            ? 'Admin preview: all financial and operational sections are visible.'
            : role === 'finance'
              ? 'Finance preview: financial summaries are visible, along with business operations.'
              : 'Employee preview: financial summaries are hidden. Your tasks, shared work, and operational activity remain visible.'}
        </p>
      </section>

      {role === 'employee' ? (
        <section>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">My Work & Shared Tasks</h3>
            <p className="mt-1 text-sm text-slate-500">
              Work assigned to you and tasks shared with the company.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: 'My Tasks', value: '2', icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
              { title: 'Due Today', value: '3', icon: CalendarDays, color: 'text-amber-600 bg-amber-50' },
              { title: 'Shared Tasks', value: '2', icon: Users, color: 'text-violet-600 bg-violet-50' },
            ].map((card) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{card.title}</p>
                    <div className={`rounded-lg p-2 ${card.color}`}><Icon size={20} /></div>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-slate-900">{card.value}</p>
                  <p className="mt-1 text-xs text-slate-500">Demo task count</p>
                </div>
              )
            })}
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-semibold text-slate-900">Upcoming Work</h3>
              <p className="mt-1 text-sm text-slate-500">Personal assignments and shared company tasks.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {demoTasks.map((task) => (
                <div key={task.title} className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-lg p-2 ${task.shared ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'}`}>
                      {task.shared ? <Users size={18} /> : <ClipboardList size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{task.detail}</p>
                      <p className="mt-1 text-xs text-slate-400">{task.shared ? 'Shared company task' : 'Assigned to you'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-11 sm:pl-0">
                    <span className="text-xs text-slate-500">{task.due}</span>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <>
          <section>
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {role === 'admin' ? 'Company Performance' : 'Financial Performance'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">Illustrative financial summary.</p>
              </div>

              <div className="inline-flex rounded-lg bg-slate-100 p-1">
                {(['monthly', 'yearly'] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setPeriod(value)}
                    aria-pressed={period === value}
                    className={`rounded-md px-4 py-2 text-sm font-medium ${
                      period === value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    {value === 'monthly' ? 'Monthly' : 'Yearly'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {financialCards.map((card) => {
                const Icon = card.icon
                return (
                  <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-500">{card.title}</p>
                        <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{card.value}</p>
                      </div>
                      <div className={`rounded-xl p-3 ${card.color}`}><Icon size={21} /></div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">{card.description}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
              <h3 className="font-semibold text-slate-900">Sales & Expenses</h3>
              <p className="mt-1 text-sm text-slate-500">
                {period === 'monthly' ? 'Monthly financial summary' : 'Yearly financial summary'}
              </p>
              <div className="mt-5 space-y-5">
                {[
                  { label: 'Sales', value: financial.sales, color: 'bg-blue-500' },
                  { label: 'Expenses', value: financial.expenses, color: 'bg-rose-400' },
                  { label: 'Net Profit', value: financial.profit, color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-semibold text-slate-800">{formatMoney(item.value)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.value / financial.sales) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-slate-400">Demo chart — replace with recorded financial data.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
              <h3 className="font-semibold text-slate-900">Business Operations</h3>
              <p className="mt-1 text-sm text-slate-500">Areas to monitor across Airtech.</p>
              <div className="mt-5 space-y-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button key={item.label} onClick={() => navigate(item.label)} className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition hover:bg-slate-50">
                      <div className="rounded-lg bg-slate-100 p-2 text-slate-600"><Icon size={18} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                      </div>
                      <ArrowRight size={16} className="mt-1 text-slate-400" />
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        </>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h3 className="font-semibold text-slate-900">
              {role === 'employee' ? 'Recent Operational Activity' : 'Recent Company Activity'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {role === 'employee'
                ? 'Recent updates that help you coordinate your work.'
                : 'A demo history of actions across the company.'}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-2.5 text-blue-600">
            <Bell size={18} />
            <span className="text-xs font-medium">Activity feed</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3 sm:px-6">
          {['All', 'Quotation', 'Customer', 'Inventory', 'Service', ...(canSeeFinancials ? ['Finance'] : [])].map((filter) => (
            <button
              key={filter}
              onClick={() => setActivityFilter(filter)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activityFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-100">
          {visibleActivities.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="flex items-start gap-3 px-5 py-4 sm:px-6">
                <div className={`shrink-0 rounded-lg p-2.5 ${item.color}`}><Icon size={19} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                  <p className="mt-1 text-xs text-slate-400">By {item.by}</p>
                </div>
                <span className="shrink-0 pt-1 text-xs text-slate-400">{item.time}</span>
              </div>
            )
          })}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
          <p className="text-xs text-slate-500">
            <Activity size={14} className="mr-1 inline" />
            Demo activity only. Real actions will be recorded after backend integration.
          </p>
        </div>
      </section>

      <footer className="flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>Airtech Business Management</span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 size={14} />
          Frontend role preview · Not a security boundary
        </span>
      </footer>
    </div>
  )
}

export default Dashboard
