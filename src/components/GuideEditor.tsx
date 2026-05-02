'use client'

import { useState, useRef } from 'react'
import {
  addSection, updateSection, deleteSection,
  addItem, updateItem, deleteItem,
} from '@/app/actions/guide'

type Item = { id: string; content: string; order_index: number }
type Section = { id: string; title: string; emoji: string; order_index: number; guide_items: Item[] }

type Props = { sections: Section[] }

export default function GuideEditor({ sections }: Props) {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [addingItemToSection, setAddingItemToSection] = useState<string | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {sections.map(section => (
        <div key={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Section header */}
          {editingSectionId === section.id ? (
            <form
              action={async (fd) => { await updateSection(section.id, fd); setEditingSectionId(null) }}
              className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100"
            >
              <input
                name="emoji"
                defaultValue={section.emoji}
                className="w-12 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="📌"
              />
              <input
                name="title"
                defaultValue={section.title}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
                autoFocus
              />
              <button type="submit" className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 transition">Save</button>
              <button type="button" onClick={() => setEditingSectionId(null)} className="text-sm text-gray-400 hover:text-gray-700 transition">Cancel</button>
            </form>
          ) : (
            <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>{section.emoji}</span> {section.title}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingSectionId(section.id)}
                  className="text-xs text-gray-400 hover:text-gray-700 transition px-2 py-1 rounded-lg hover:bg-gray-100"
                >
                  Edit title
                </button>
                {confirmDelete === section.id ? (
                  <span className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Delete section?</span>
                    <form action={deleteSection.bind(null, section.id)} className="inline">
                      <button type="submit" className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1">Yes</button>
                    </form>
                    <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">No</button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(section.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition px-2 py-1 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="divide-y divide-gray-50">
            {section.guide_items
              .sort((a, b) => a.order_index - b.order_index)
              .map(item => (
                <div key={item.id} className="px-5 py-3">
                  {editingItemId === item.id ? (
                    <form
                      action={async (fd) => { await updateItem(item.id, fd); setEditingItemId(null) }}
                      className="flex items-center gap-2"
                    >
                      <input
                        name="content"
                        defaultValue={item.content}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        autoFocus
                      />
                      <button type="submit" className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition">Save</button>
                      <button type="button" onClick={() => setEditingItemId(null)} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between gap-3 group">
                      <p className="text-sm text-gray-700 leading-relaxed flex-1">
                        <span className="text-gray-300 mr-2">—</span>{item.content}
                      </p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                        <button
                          onClick={() => setEditingItemId(item.id)}
                          className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition"
                        >
                          Edit
                        </button>
                        <form action={deleteItem.bind(null, item.id)} className="inline">
                          <button type="submit" className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition">
                            ✕
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              ))}

            {/* Add item row */}
            {addingItemToSection === section.id ? (
              <form
                action={async (fd) => { await addItem(section.id, fd); setAddingItemToSection(null) }}
                className="px-5 py-3 flex items-center gap-2"
              >
                <input
                  name="content"
                  placeholder="Write a tip or instruction…"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  autoFocus
                />
                <button type="submit" className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition">Add</button>
                <button type="button" onClick={() => setAddingItemToSection(null)} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
              </form>
            ) : (
              <button
                onClick={() => setAddingItemToSection(section.id)}
                className="w-full text-left px-5 py-3 text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
              >
                <span className="text-lg leading-none">+</span> Add a tip to this section
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add new section */}
      {showAddSection ? (
        <form
          action={async (fd) => { await addSection(fd); setShowAddSection(false) }}
          className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 flex items-center gap-3"
        >
          <input
            name="emoji"
            placeholder="📌"
            className="w-14 text-center border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <input
            name="title"
            placeholder="Section name, e.g. House Rules"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            autoFocus
          />
          <button type="submit" className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-gray-700 transition whitespace-nowrap">
            Add Section
          </button>
          <button type="button" onClick={() => setShowAddSection(false)} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
        </form>
      ) : (
        <button
          onClick={() => setShowAddSection(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:text-gray-700 hover:border-gray-300 hover:bg-white transition flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Add a new section
        </button>
      )}
    </div>
  )
}
