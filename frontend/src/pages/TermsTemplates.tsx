
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
        class:
          'min-h-[300px] w-full px-5 py-4 text-sm leading-7 text-slate-800 focus:outline-none',
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#142d4e]">
            Terms &amp; Conditions
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Create, edit, save and reuse terms for Airtech quotations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView('saved')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileText size={17} />
            Saved Terms
          </button>
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
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
          >
            {importing ? <LoaderCircle size={17} className="animate-spin" /> : <FileUp size={17} />}
            {importing ? 'Importing…' : 'Import Word (.docx)'}
          </button>
          <button
            type="button"
            onClick={startNewTemplate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            New template
          </button>
        </div>
      </div>

      {view === 'saved' && (
        <section className="space-y-4" aria-label="Saved terms templates">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-[#142d4e]">Saved Terms &amp; Conditions</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search, review, edit, or delete your saved terms templates.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadTemplates()}
                disabled={loading}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
              <button
                type="button"
                onClick={startNewTemplate}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                Create Terms
              </button>
            </div>
          </div>

          <label className="relative block">
            <Search size={17} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search template name, company, status, or terms…"
              aria-label="Search saved terms"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
              Loading saved terms templates…
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              {templates.length === 0
                ? 'No saved terms templates yet. Choose Create Terms to make your first template.'
                : 'No templates match your search.'}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTemplates.map((item) => (
                <article
                  key={item.template_id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setViewingTemplate(item)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold text-[#142d4e]">{item.name}</span>
                      <span className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>{item.company || 'Airtech'}</span>
                        <span>•</span>
                        <span>{item.status || 'Draft'}</span>
                        <span>•</span>
                        <span>{item.include_in_pdf ? 'Included in quotation PDF' : 'Not included in quotation PDF'}</span>
                      </span>
                      <span className="mt-2 block text-sm text-slate-500">
                        {(item.content_html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180) || 'No terms content yet.'}
                        {(item.content_html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().length > 180 ? '…' : ''}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-blue-700">
                      View <span aria-hidden="true">›</span>
                    </span>
                  </button>
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3">
                    <button
                      type="button"
                      onClick={() => selectTemplate(item.template_id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteTemplate(item)}
                      disabled={deletingId === item.template_id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
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
              ))}
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
                <p className="mt-1 text-sm text-slate-500">
                  {viewingTemplate.company || 'Airtech'} · {viewingTemplate.status || 'Draft'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close terms drawer"
                onClick={() => setViewingTemplate(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              <div className="mb-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                  {viewingTemplate.include_in_pdf ? 'Included in quotation PDF' : 'Not included in quotation PDF'}
                </span>
              </div>
              {viewingTemplate.content_html?.trim() ? (
                <div
                  className="prose prose-sm max-w-none break-words text-slate-700 [&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:p-2 [&_p]:my-2"
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
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Pencil size={15} />
                Edit Terms
              </button>
            </div>
          </aside>
        </div>
      )}

      {view === 'create' && (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="font-semibold text-[#142d4e]">Template editor</h2>
            <p className="text-sm text-slate-500">
              Import a Word .docx file or edit clauses and tables below. Import replaces the current editor content.
            </p>
          </div>
        </div>

        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Saved templates
            <select
              value={templateId}
              onChange={(event) => selectTemplate(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal"
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
            Template name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
              placeholder="Enter template name"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Company
            <select
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal"
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
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal"
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
            </select>
          </label>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-300">
          <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
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
            <ToolbarButton
              label="Insert table"
              onClick={insertTable}
            >
              <Table2 size={16} />
              Table
            </ToolbarButton>
            <ToolbarButton
              label="Add table row"
              onClick={() =>
                editor.chain().focus().addRowAfter().run()
              }
            >
              + Row
            </ToolbarButton>
            <ToolbarButton
              label="Add table column"
              onClick={() =>
                editor.chain().focus().addColumnAfter().run()
              }
            >
              + Column
            </ToolbarButton>
            <ToolbarButton
              label="Delete table"
              onClick={() => editor.chain().focus().deleteTable().run()}
            >
              Delete table
            </ToolbarButton>
          </div>

          <EditorContent editor={editor} />
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Click inside the editor to type. Click a table cell to edit it.
          Use the toolbar to format text and manage tables.
        </p>

        <label className="mt-5 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeInPdf}
            onChange={(event) => setIncludeInPdf(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Include these terms in quotation PDF
        </label>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-500">
            {loading
              ? 'Loading saved templates…'
              : `${templates.length} saved template(s)`}
          </span>

          <button
            type="button"
            onClick={() => void saveTemplate()}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Saving…' : templateId ? 'Update template' : 'Save template'}
          </button>
        </div>

        {message && (
          <p
            role="status"
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              message.toLowerCase().includes('fail') ||
              message.toLowerCase().includes('could not')
                ? 'bg-red-50 text-red-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            {message}
          </p>
        )}
      </div>
      )}
    </div>
  )
}

function ToolbarButton({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium ${
        active
          ? 'border-blue-300 bg-blue-100 text-blue-800'
          : 'border-transparent text-slate-700 hover:border-slate-300 hover:bg-white'
      }`}
    >
      {children}
    </button>
  )
}
