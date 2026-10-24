
import {
  FilePlus2,
  FileText,
  Users,
  Package,
  ClipboardList,
  Wrench,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  CircleAlert,
  ChevronRight,
  Building2,
  Headphones,
} from 'lucide-react'

const stats = [
  {
    label: 'Total Quotations',
    value: '—',
    note: 'Your quotation records',
    icon: FileText,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-700',
  },
  {
    label: 'Total Clients',
    value: '—',
    note: 'Your customer directory',
    icon: Users,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-700',
  },
  {
    label: 'Open Tickets',
    value: '—',
    note: 'Issues needing attention',
    icon: Headphones,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-700',
  },
  {
    label: 'Products & Inventory',
    value: '—',
    note: 'Your product catalogue',
    icon: Package,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-700',
  },
]

function Dashboard() {
  const openQuotation = () => {
    window.dispatchEvent(new Event('airtech:create-quotation'))
  }

  const openPage = (page: string) => {
    window.dispatchEvent(
      new CustomEvent('airtech:navigate', {
        detail: page,
      }),
    )
  }

  const quickActions = [
    {
      label: 'New quotation',
      description: 'Prepare a quotation for a customer',
      icon: FilePlus2,
      color: 'bg-blue-50 text-blue-700',
      onClick: openQuotation,
    },
    {
      label: 'Add client',
      description: 'Open your customer directory',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-700',
      onClick: () => openPage('Customers'),
    },
    {
      label: 'Raise support ticket',
      description: 'Record an equipment issue or repair',
      icon: ClipboardList,
      color: 'bg-amber-50 text-amber-700',
      onClick: () => openPage('Service & Maintenance'),
    },
    {
      label: 'View inventory',
      description: 'Manage products and equipment',
      icon: Package,
      color: 'bg-violet-50 text-violet-700',
      onClick: () => openPage('Products & Inventory'),
    },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7">
      {/* Welcome */}
      <section className="flex flex-col justify-between gap-5 rounded-2xl bg-[#142d4e] p-6 text-white shadow-sm sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
            AIRTECH BUSINESS MANAGEMENT
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Business Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Manage quotations, customers, inventory and service requests from
            one place.
          </p>
        </div>

        <button
          type="button"
          onClick={openQuotation}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#142d4e] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#142d4e]"
        >
          <FilePlus2 size={18} />
          New quotation
        </button>
      </section>

      {/* Overview statistics */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">
            Business overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            A quick view of your main business areas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon

            return (
              <article
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                      {item.value}
                    </p>
                  </div>

                  <div className={`rounded-xl p-3 ${item.iconBg} ${item.iconColor}`}>
                    <Icon size={21} strokeWidth={1.8} />
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-500">{item.note}</p>
              </article>
            )
          })}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Jump directly to a common task.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon

            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5"
              >
                <div className={`shrink-0 rounded-xl p-3 ${action.color}`}>
                  <Icon size={21} strokeWidth={1.8} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {action.label}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {action.description}
                  </p>
                </div>

                <ChevronRight
                  size={18}
                  className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
                />
              </button>
            )
          })}
        </div>
      </section>

      {/* Operational overview */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <Building2 size={21} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Customer management</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Keep customer details organized and find client records when
                preparing quotations or handling service requests.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openPage('Customers')}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            Open customers
            <ArrowUpRight size={16} />
          </button>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
              <Wrench size={21} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Service desk</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Review customer issues, equipment breakdowns, maintenance
                requests and support tickets.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openPage('Service & Maintenance')}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            Open service desk
            <ArrowUpRight size={16} />
          </button>
        </article>
      </section>

      {/* Future live activity section */}
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
            <Clock3 size={21} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Recent activity</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Recent quotations, new customers, ticket updates and inventory
              changes will appear here once the dashboard is connected to live
              backend data.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          <CircleAlert size={16} />
          Live dashboard data is not connected yet.
          <CheckCircle2 size={16} className="ml-auto text-emerald-600" />
        </div>
      </section>
    </div>
  )
}

export default Dashboard
