import { FilePlus2 } from 'lucide-react'

function Dashboard() {
  const openQuotation = () => {
    window.dispatchEvent(new Event('airtech:create-quotation'))
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <button
        type="button"
        onClick={openQuotation}
        className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-[#142d4e] px-7 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#1d416b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
      >
        <FilePlus2 size={20} strokeWidth={1.8} />
        New quotation
      </button>
    </div>
  )
}

export default Dashboard