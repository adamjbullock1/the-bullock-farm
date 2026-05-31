'use client'

import { useState, useRef, useEffect } from 'react'
import { addSection, updateSection, deleteSection } from '@/app/actions/guide'

type Section = {
  id: string
  title: string
  emoji: string
  order_index: number
  body?: string | null
  video_url?: string | null
}

type Props = { sections: Section[] }

const EMOJIS = [
  '🏡','🌿','🌾','🌻','🌲','🌳','🍂','🍃','🔥','💧','⭐','📌',
  '🐄','🐓','🐑','🐕','🐈','🦌','🐝','🦋','🐛','🦎',
  '🛖','🏕️','🛁','🚿','🍳','🍽️','☕','🧹','🪵','🪣','🔑','🔒',
  '🚗','🛻','🚜','⛽','🅿️','🗺️','📍','🧭',
  '📋','📝','✅','⚠️','🚫','ℹ️','💡','📞','🩹','🧰',
  '🎣','🏊','🚴','🎯','🎮','🃏','🏈','⚽','🎸','🎉',
]

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-14 h-10 text-center border border-gray-200 rounded-lg text-xl hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition">
        {value || '📌'}
      </button>
      {open && (
        <div className="absolute left-0 top-12 z-30 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 w-72">
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map(e => (
              <button key={e} type="button" onClick={() => { onChange(e); setOpen(false) }}
                className={`text-xl p-1.5 rounded-lg hover:bg-gray-100 transition ${value === e ? 'bg-gray-100' : ''}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ToolbarButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="px-2 py-1 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition font-mono"
    >
      {children}
    </button>
  )
}

function MarkdownToolbar({ textareaRef, value, onChange }: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (v: string) => void
}) {
  function wrap(before: string, after: string, placeholder: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end) || placeholder
    const newVal = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(newVal)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }

  function insertAtLineStart(prefix: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const newVal = value.slice(0, lineStart) + prefix + value.slice(lineStart)
    onChange(newVal)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
  }

  function insertLink() {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end) || 'link text'
    const newVal = value.slice(0, start) + `[${selected}](url)` + value.slice(end)
    onChange(newVal)
    setTimeout(() => {
      el.focus()
      // select the 'url' part
      const urlStart = start + selected.length + 3
      el.setSelectionRange(urlStart, urlStart + 3)
    }, 0)
  }

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border border-gray-200 rounded-t-xl bg-gray-50 border-b-0">
      <ToolbarButton onClick={() => wrap('**', '**', 'bold text')} title="Bold"><strong>B</strong></ToolbarButton>
      <ToolbarButton onClick={() => wrap('*', '*', 'italic text')} title="Italic"><em>I</em></ToolbarButton>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <ToolbarButton onClick={() => insertAtLineStart('- ')} title="Bullet list">• List</ToolbarButton>
      <ToolbarButton onClick={() => insertAtLineStart('1. ')} title="Numbered list">1. List</ToolbarButton>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <ToolbarButton onClick={insertLink} title="Link">🔗 Link</ToolbarButton>
    </div>
  )
}

function SectionEditForm({ section, onDone }: { section: Section; onDone: () => void }) {
  const [body, setBody] = useState(section.body ?? '')
  const [emoji, setEmoji] = useState(section.emoji)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <form
      action={async (fd) => {
        fd.set('emoji', emoji)
        fd.set('body', body)
        await updateSection(section.id, fd)
        onDone()
      }}
      className="p-5 space-y-3"
    >
      {/* Title row */}
      <div className="flex items-center gap-3">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input
          name="title"
          defaultValue={section.title}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
          autoFocus
        />
      </div>

      {/* Markdown toolbar + textarea */}
      <div>
        <MarkdownToolbar textareaRef={textareaRef} value={body} onChange={setBody} />
        <textarea
          ref={textareaRef}
          name="body"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={8}
          placeholder="Write tips, instructions, notes… use line breaks to organise."
          className="w-full border border-gray-200 rounded-b-xl px-3 py-2.5 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-300"
        />
      </div>

      {/* Video URL */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Google Drive video link (optional)</label>
        <input
          name="video_url"
          defaultValue={section.video_url ?? ''}
          placeholder="https://drive.google.com/file/d/…/view"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-300"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button type="submit" className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-gray-700 transition">Save</button>
        <button type="button" onClick={onDone} className="text-sm text-gray-400 hover:text-gray-700 transition px-3 py-2">Cancel</button>
      </div>
    </form>
  )
}

export default function GuideEditor({ sections }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [newSectionEmoji, setNewSectionEmoji] = useState('📌')

  return (
    <div className="space-y-4">
      {sections.map(section => (
        <div key={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {editingId === section.id ? (
            <SectionEditForm section={section} onDone={() => setEditingId(null)} />
          ) : (
            <>
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span>{section.emoji}</span> {section.title}
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingId(section.id)}
                    className="text-xs text-gray-400 hover:text-gray-700 transition px-2 py-1 rounded-lg hover:bg-gray-100">
                    Edit
                  </button>
                  {confirmDelete === section.id ? (
                    <span className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Delete?</span>
                      <form action={deleteSection.bind(null, section.id)} className="inline">
                        <button type="submit" className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1">Yes</button>
                      </form>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">No</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmDelete(section.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition px-2 py-1 rounded-lg hover:bg-red-50">
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <div className="px-5 py-4 space-y-4">
                {section.body
                  ? <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{section.body}</p>
                  : <p className="text-sm text-gray-400 italic">No content yet — click Edit to add some.</p>
                }
                {section.video_url && (
                  <div className="rounded-xl overflow-hidden aspect-video bg-black">
                    <iframe src={section.video_url.replace('/view', '/preview').replace(/\?.*$/, '')}
                      className="w-full h-full" allow="autoplay" allowFullScreen />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      {showAddSection ? (
        <form
          action={async (fd) => {
            fd.set('emoji', newSectionEmoji)
            await addSection(fd)
            setShowAddSection(false)
            setNewSectionEmoji('📌')
          }}
          className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 flex items-center gap-3"
        >
          <EmojiPicker value={newSectionEmoji} onChange={setNewSectionEmoji} />
          <input name="title" placeholder="Section name, e.g. House Rules"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" autoFocus />
          <button type="submit" className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-gray-700 transition whitespace-nowrap">
            Add Section
          </button>
          <button type="button" onClick={() => setShowAddSection(false)} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
        </form>
      ) : (
        <button onClick={() => setShowAddSection(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:text-gray-700 hover:border-gray-300 hover:bg-white transition flex items-center justify-center gap-2">
          <span className="text-lg leading-none">+</span> Add a new section
        </button>
      )}
    </div>
  )
}
