import { useCallback, useEffect, useRef, useState } from 'react'
import mammoth from 'mammoth'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Table2,
  Plus,
  Save,
  FileText,
  FileUp,
  LoaderCircle,
  Search,
  Trash2,
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react'

const API_URL = 'http://127.0.0.1:8000/api/terms-templates/'

type Template = {
  template_id: string
  name: string
  company: string
  status: string
  content_html: string
  include_in_pdf: boolean
}

const emptyContent =
  '<h2>Terms &amp; Conditions</h2><ol><li><p>Enter your terms and conditions here.</p></li></ol>'

type TermsTemplatesProps = { initialView?: 'create' | 'saved' }

/* ---------- shared presentation ---------- */

// Browsers reset headings, lists and tables, so the editor and the preview
// drawer both need these rules to look like real terms.
const contentStyles =
  'break-words text-slate-700 [&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[#142d4e] [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_td]:align-top [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2 [&_th]:text-left [&_p]:my-2'

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:border-blue-400'

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#142d4e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d416b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

function StatusBadge({ status }: { status?: string }) {
  const label = status || 'Draft'
  const style =
    label.toLowerCase() === 'active'
      ? 'bg-green-50 text-green-700 ring-green-200'
      : 'bg-slate-100 text-slate-700 ring-slate-200'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  )
}

function plainText(html?: string) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function TermsTemplates({ initialView = 'create' }: TermsTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateId, setTemplateId] = useState('')
  const [view, setView] = useState<'create' | 'saved'>(initialView)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [name, setName] = useState('Airtech Airtime / Walkie-Talkie Rental')
  const [company, setCompany] = useState('Airtech')
  const [status, setStatus] = useState('Draft')
  const [includeInPdf, setIncludeInPdf] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: emptyContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `min-h-[320px] w-full px-5 py-4 text-sm leading-7 focus:outline-none ${contentStyles}`,
      },
    },
  })

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error('Could not load templates.')

      const data = await response.json()
      const list: Template[] = Array.isArray(data)
        ? data
        : data.templates ?? []

      setTemplates(list)
    } catch {
      setMessage(
        'Could not connect to the templates API. Check that the backend is running.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  useEffect(() => {
    setView(initialView)
  }, [initialView])

  function startNewTemplate() {
    setView('create')
    setTemplateId('')
    setName('Airtech Airtime / Walkie-Talkie Rental')
    setCompany('Airtech')
    setStatus('Draft')
    setIncludeInPdf(true)
    editor?.commands.setContent(emptyContent)
    setMessage('')
  }

  function selectTemplate(id: string) {
    setView('create')
    const selected = templates.find((item) => item.template_id === id)
    if (!selected) return

    setTemplateId(selected.template_id)
    setName(selected.name)
    setCompany(selected.company || 'Airtech')
    setStatus(selected.status || 'Draft')
    setIncludeInPdf(selected.include_in_pdf ?? true)
    editor?.commands.setContent(selected.content_html || '<p></p>')
    setMessage('')
  }


  async function deleteTemplate(template: Template) {
    const confirmed = window.confirm(
      `Delete the terms template "${template.name}"? This cannot be undone.`,
    )
    if (!confirmed) return

    setDeletingId(template.template_id)
    setMessage('')
    try {
      const response = await fetch(
        `${API_URL}${encodeURIComponent(template.template_id)}`,
        { method: 'DELETE' },
      )
      if (!response.ok) {
        const detail = await response.text()
        throw new Error(
          response.status === 405
            ? 'The backend does not support deleting terms templates yet. We need to add its DELETE endpoint.'
            : detail || `Could not delete template (HTTP ${response.status}).`,
        )
      }

      setTemplates((current) =>
        current.filter((item) => item.template_id !== template.template_id),
      )
      if (templateId === template.template_id) startNewTemplate()
      setMessage('Template deleted successfully.')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not delete the template.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  const filteredTemplates = templates.filter((item) => {
    const query = searchTerm.trim().toLowerCase()
    return (
      !query ||
      item.name.toLowerCase().includes(query) ||
      (item.company || '').toLowerCase().includes(query) ||
      (item.status || '').toLowerCase().includes(query) ||
      (item.content_html || '').replace(/<[^>]*>/g, ' ').toLowerCase().includes(query)
    )
  })

  async function importWordDocument(file?: File) {
    if (!file || !editor) return

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setMessage('Please select a Word .docx file.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setImporting(true)
    setMessage('Importing Word document…')

    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      const importedHtml = result.value.trim()

      if (!importedHtml || importedHtml === '<p></p>') {
        throw new Error('No readable content was found.')
      }

      const sourceTableCount =
        (importedHtml.match(/<table\b/gi) || []).length

      if (sourceTableCount > 0) {
        // Insert Word HTML so Tiptap can parse its table elements.
        editor.commands.setContent(importedHtml)

        const savedHtml = editor.getHTML()
        const editorTableCount =
          (savedHtml.match(/<table\b/gi) || []).length

        if (editorTableCount === 0) {
          throw new Error(
            'Word contains a table, but the editor could not preserve it. Check the Tiptap table extensions.'
          )
        }

        setMessage(
          `Imported successfully: ${sourceTableCount} table(s) detected and preserved. Review the formatting before saving.`
        )
      } else {
        editor.commands.setContent(importedHtml)
        setMessage(
          'Text imported, but no real Word tables were detected in the converted content.'
        )
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Import failed: ${error.message}`
          : 'Import failed. Please try another Word document.'
      )
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function saveTemplate() {
    if (!editor) return

    if (!name.trim()) {
      setMessage('Please enter a template name.')
      return
    }

    setSaving(true)
    setMessage('')

    const payload = {
      name: name.trim(),
      company,
      status,
      content_html: editor.getHTML(),
      include_in_pdf: includeInPdf,
    }

    try {
      const url = templateId
        ? `${API_URL}${encodeURIComponent(templateId)}`
        : API_URL

      const response = await fetch(url, {
        method: templateId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const details = await response.text()
        throw new Error(details || 'The server could not save the template.')
      }

      const result = await response.json().catch(() => ({}))
      await loadTemplates()

      const savedId =
        result.template_id ??
        result.template?.template_id ??
        templateId

      if (savedId) {
        setTemplateId(String(savedId))
      }

      setMessage('Template saved successfully.')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Save failed: ${error.message}`
          : 'Save failed. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  function insertTable() {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
  }

  if (!editor) {
    return <p className="text-sm text-slate-500">Loading editor...</p>
  }

  // Presentation only: pick a colour for the status message.
  const lowered = message.toLowerCase()
  const tone: 'error' | 'success' | 'warning' | 'info' =
    lowered.includes('fail') ||
    lowered.includes('could not') ||
    lowered.includes('not support')
      ? 'error'
      : lowered.includes('successfully')
        ? 'success'
        : lowered.startsWith('please') || lowered.includes('no real word tables')
          ? 'warning'
          : 'info'
  const toneStyles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-green-200 bg-green-50 text-green-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  }[tone]
  const ToneIcon =
    tone === 'success' ? CheckCircle2 : tone === 'info' ? Info : AlertCircle

  const inTable = editor.isActive('table')

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142d4e]">
            Terms &amp; Conditions
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Create, edit, save and reuse terms for Airtech quotations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(event) => void importWordDocument(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className={secondaryBtn}
          >
            {importing ? <LoaderCircle size={17} className="animate-spin" /> : <FileUp size={17} />}
            {importing ? 'Importing…' : 'Import Word (.docx)'}
          </button>
          <button type="button" onClick={startNewTemplate} className={primaryBtn}>
            <Plus size={17} />
            New template
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Terms sections"
        className="flex gap-6 border-b border-slate-200"
      >
        {([
          ['create', 'Editor', FileText],
          ['saved', `Saved terms${templates.length ? ` (${templates.length})` : ''}`, List],
        ] as const).map(([id, label, Icon]) => {
          const active = view === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setView(id)}
              className={`-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
                active
                  ? 'border-[#142d4e] text-[#142d4e]'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Status message (shown on both tabs) */}
      {message && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${toneStyles}`}
        >
          <ToneIcon size={18} className="mt-0.5 shrink-0" />
          <span className="flex-1">{message}</span>
          <button
            type="button"
            onClick={() => setMessage('')}
            aria-label="Dismiss message"
            className="rounded p-0.5 opacity-70 hover:bg-black/5 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {view === 'saved' && (
        <section className="space-y-4" aria-label="Saved terms templates">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block flex-1">
              <Search size={17} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search template name, company, status, or terms…"
                aria-label="Search saved terms"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-sm placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </label>
            <button
              type="button"
              onClick={() => void loadTemplates()}
              disabled={loading}
              className={secondaryBtn}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div aria-busy="true" className="grid gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <FileText className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">
                {templates.length === 0
                  ? 'No saved terms templates yet'
                  : 'No templates match your search'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {templates.length === 0
                  ? 'Create your first template to reuse it on quotations.'
                  : 'Try a different word or clear the search.'}
              </p>
              {templates.length === 0 && (
                <button type="button" onClick={startNewTemplate} className={`${primaryBtn} mt-4`}>
                  <Plus size={16} />
                  Create terms
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTemplates.map((item) => {
                const preview = plainText(item.content_html)
                return (
                  <article
                    key={item.template_id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <button
                      type="button"
                      onClick={() => setViewingTemplate(item)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-base font-semibold text-[#142d4e]">
                            {item.name}
                          </span>
                          <StatusBadge status={item.status} />
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {item.company || 'Airtech'} ·{' '}
                          {item.include_in_pdf
                            ? 'Included in quotation PDF'
                            : 'Not included in quotation PDF'}
                        </span>
                        <span className="mt-2 block text-sm text-slate-600">
                          {preview.slice(0, 180) || 'No terms content yet.'}
                          {preview.length > 180 ? '…' : ''}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-medium text-blue-700">
                        Preview <span aria-hidden="true">›</span>
                      </span>
                    </button>
                    <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                      <button
                        type="button"
                        onClick={() => selectTemplate(item.template_id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#142d4e] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1d416b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteTemplate(item)}
                        disabled={deletingId === item.template_id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 disabled:opacity-60"
                      >
                        {deletingId === item.template_id ? (
                          <LoaderCircle size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                        {deletingId === item.template_id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {viewingTemplate && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-slate-950/40 backdrop-blur-[1px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewingTemplate(null)
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`${viewingTemplate.name} terms details`}
            className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-bold text-[#142d4e]">{viewingTemplate.name}</h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>{viewingTemplate.company || 'Airtech'}</span>
                  <StatusBadge status={viewingTemplate.status} />
                </div>
              </div>
              <button
                type="button"
                aria-label="Close terms drawer"
                onClick={() => setViewingTemplate(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              <p className="mb-4 inline-block rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                {viewingTemplate.include_in_pdf ? 'Included in quotation PDF' : 'Not included in quotation PDF'}
              </p>
              {viewingTemplate.content_html?.trim() ? (
                <div
                  className={`max-w-none text-sm leading-7 ${contentStyles}`}
                  dangerouslySetInnerHTML={{ __html: viewingTemplate.content_html }}
                />
              ) : (
                <p className="text-sm italic text-slate-400">This template has no terms content.</p>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={() => setViewingTemplate(null)}
                className={secondaryBtn}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const selectedId = viewingTemplate.template_id
                  setViewingTemplate(null)
                  selectTemplate(selectedId)
                }}
                className={primaryBtn}
              >
                <Pencil size={15} />
                Edit terms
              </button>
            </div>
          </aside>
        </div>
      )}

      {view === 'create' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <h2 className="font-semibold text-[#142d4e]">Template details</h2>
              <p className="mt-1 text-sm text-slate-500">
                {templateId ? 'You are editing a saved template.' : 'You are creating a new template.'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Open a saved template
                <select
                  value={templateId}
                  onChange={(event) => selectTemplate(event.target.value)}
                  className={fieldClass}
                >
                  <option value="">New template</option>
                  {templates.map((item) => (
                    <option key={item.template_id} value={item.template_id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Template name <span className="text-red-500">*</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={fieldClass}
                  placeholder="Enter template name"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Company
                <select
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  className={fieldClass}
                >
                  <option value="Airtech">Airtech</option>
                  <option value="Airtalk">Airtalk</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className={fieldClass}
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                </select>
              </label>
            </div>

            <div>
              <div className="mb-2 flex items-end justify-between gap-3">
                <h2 className="font-semibold text-[#142d4e]">Terms content</h2>
                <p className="text-xs text-slate-500">
                  Importing a Word file replaces what is in the editor.
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/30">
                <div
                  role="toolbar"
                  aria-label="Text formatting"
                  className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2"
                >
                  <ToolbarButton
                    label="Bold"
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                  >
                    <Bold size={16} />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Italic"
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                  >
                    <Italic size={16} />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Heading"
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                  >
                    <Heading2 size={16} />
                  </ToolbarButton>

                  <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-300" />

                  <ToolbarButton
                    label="Numbered list"
                    active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  >
                    <ListOrdered size={16} />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Bullet list"
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                  >
                    <List size={16} />
                  </ToolbarButton>

                  <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-300" />

                  <ToolbarButton label="Insert table" onClick={insertTable}>
                    <Table2 size={16} />
                    Table
                  </ToolbarButton>
                  <ToolbarButton
                    label="Add table row"
                    disabled={!inTable}
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                  >
                    + Row
                  </ToolbarButton>
                  <ToolbarButton
                    label="Add table column"
                    disabled={!inTable}
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                  >
                    + Column
                  </ToolbarButton>
                  <ToolbarButton
                    label="Delete table"
                    disabled={!inTable}
                    danger
                    onClick={() => editor.chain().focus().deleteTable().run()}
                  >
                    <Trash2 size={15} />
                    Delete table
                  </ToolbarButton>
                </div>

                <EditorContent editor={editor} />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Row, column and delete-table buttons turn on when your cursor is inside a table.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm">
              <input
                type="checkbox"
                checked={includeInPdf}
                onChange={(event) => setIncludeInPdf(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
              />
              <span>
                <span className="block font-medium text-slate-800">
                  Include these terms in the quotation PDF
                </span>
                <span className="block text-slate-500">
                  Turn this off to keep the template saved without printing it.
                </span>
              </span>
            </label>
          </div>

          <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
            <span className="text-xs text-slate-500">
              {loading
                ? 'Loading saved templates…'
                : `${templates.length} saved template(s)`}
            </span>

            <button
              type="button"
              onClick={() => void saveTemplate()}
              disabled={saving || loading}
              className={primaryBtn}
            >
              {saving ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? 'Saving…' : templateId ? 'Update template' : 'Save template'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  danger = false,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  danger?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'border-blue-300 bg-blue-100 text-blue-800'
          : danger
            ? 'border-transparent text-red-700 hover:border-red-200 hover:bg-red-50'
            : 'border-transparent text-slate-700 hover:border-slate-300 hover:bg-white'
      }`}
    >
      {children}
    </button>
  )
}