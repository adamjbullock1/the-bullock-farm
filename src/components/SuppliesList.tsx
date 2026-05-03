'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addSupplyItem, markPurchased, unmarkPurchased, deleteSupplyItem, updateSupplyItem } from '@/app/actions/supplies'

function ThreeDotMenu({ options, direction = 'up' }: {
  options: { label: string; onClick: () => void; danger?: boolean }[]
  direction?: 'up' | 'down'
}) {
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
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
        </svg>
      </button>
      {open && (
        <div className={`absolute right-0 z-20 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 text-sm ${direction === 'down' ? 'top-8' : 'bottom-8'}`}>
          {options.map(opt => (
            <button
              key={opt.label}
              onClick={() => { opt.onClick(); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 transition ${opt.danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PurchasedCard({ purchased, currentUserId, isAdmin, onUnmark, onDelete, onDeleteAll }: {
  purchased: Item[]
  currentUserId: string
  isAdmin: boolean
  onUnmark: (item: Item) => void
  onDelete: (id: string) => void
  onDeleteAll: () => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">Recently Purchased</h3>
        {isAdmin && (
          <ThreeDotMenu direction="down" options={[
            { label: 'Clear all purchased', onClick: onDeleteAll, danger: true },
          ]} />
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {purchased.map(item => {
          const buyerName = item.purchaser?.full_name?.split(' ')[0] ?? 'Someone'
          const date = new Date(item.purchased_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const isMine = item.purchased_by === currentUserId
          const menuOptions = [
            { label: 'Need this again', onClick: () => onUnmark(item) },
            ...((isAdmin || item.added_by === currentUserId)
              ? [{ label: 'Delete', onClick: () => onDelete(item.id), danger: true }]
              : []),
          ]
          return (
            <div key={item.id} className="flex items-start gap-3 px-5 py-3.5">
              <span className="mt-0.5 text-green-500 text-base shrink-0">✓</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 line-through">{item.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Purchased by <span className="font-medium text-gray-500">{isMine ? 'you' : buyerName}</span> · {date}
                </p>
              </div>
              <ThreeDotMenu options={menuOptions} direction="down" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

type Item = {
  id: string
  name: string
  note: string | null
  added_by: string | null
  purchased_by: string | null
  purchased_at: string | null
  profiles: { full_name: string | null } | null
  purchaser: { full_name: string | null } | null
}

type Props = {
  items: Item[]
  currentUserId: string
  isAdmin: boolean
}

export default function SuppliesList({ items: initial, currentUserId, isAdmin }: Props) {
  const [items, setItems] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [purchasing, setPurchasing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const router = useRouter()

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleMarkPurchasedBatch() {
    if (selected.size === 0) return
    setPurchasing(true)
    const ids = Array.from(selected)
    // Optimistic update
    setItems(prev => prev.map(i => ids.includes(i.id)
      ? { ...i, purchased_by: currentUserId, purchased_at: new Date().toISOString() }
      : i
    ))
    setSelected(new Set())
    await Promise.all(ids.map(id => markPurchased(id)))
    router.refresh()
    setPurchasing(false)
  }

  const needed = items.filter(i => !i.purchased_at)
  const purchased = items.filter(i => i.purchased_at)
    .sort((a, b) => new Date(b.purchased_at!).getTime() - new Date(a.purchased_at!).getTime())
    .slice(0, 10) // show last 10 purchased

  async function handleAdd(fd: FormData) {
    setAdding(true)
    const name = (fd.get('name') as string).trim()
    const note = (fd.get('note') as string | null)?.trim() || null
    if (!name) { setAdding(false); return }

    // Optimistic update
    const tempItem: Item = {
      id: `temp-${Date.now()}`,
      name,
      note,
      added_by: currentUserId,
      purchased_by: null,
      purchased_at: null,
      profiles: null,
      purchaser: null,
    }
    setItems(prev => [...prev, tempItem])
    setShowAdd(false)
    setAdding(false)

    await addSupplyItem(fd)
    router.refresh()
  }

  async function handleUnmark(item: Item) {
    await unmarkPurchased(item.id)
    setItems(prev => prev.map(i => i.id === item.id
      ? { ...i, purchased_by: null, purchased_at: null }
      : i
    ))
  }

  async function handleDelete(itemId: string) {
    await deleteSupplyItem(itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  return (
    <div className="space-y-6">

      {/* ── Needed ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Needed</h3>
            {needed.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{needed.length} item{needed.length !== 1 ? 's' : ''}</p>
            )}
          </div>
          <button
            onClick={() => setShowAdd(o => !o)}
            className="text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
          >
            + Add item
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <form action={handleAdd} className="px-5 py-4 border-b border-gray-100 space-y-2 bg-gray-50">
            <input
              name="name"
              required
              placeholder="Item name, e.g. Laundry detergent"
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <input
              name="note"
              placeholder="Optional note, e.g. Tide original, large bottle"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adding}
                className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-700 transition disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="text-sm text-gray-500 px-4 py-2 rounded-xl hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {needed.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm font-medium text-gray-700">All stocked up!</p>
            <p className="text-xs text-gray-400 mt-1">Add items when supplies run low.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {needed.map(item => {
                const isChecked = selected.has(item.id)
                const isEditing = editingId === item.id
                const canEdit = isAdmin || item.added_by === currentUserId

                if (isEditing) {
                  return (
                    <div key={item.id} className="px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                      <form
                        action={async (fd) => {
                          await updateSupplyItem(item.id, fd)
                          setItems(prev => prev.map(i => i.id === item.id
                            ? { ...i, name: (fd.get('name') as string).trim(), note: (fd.get('note') as string)?.trim() || null }
                            : i
                          ))
                          setEditingId(null)
                          router.refresh()
                        }}
                        className="space-y-2"
                      >
                        <input name="name" defaultValue={item.name} required autoFocus
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                        <input name="note" defaultValue={item.note ?? ''} placeholder="Optional note"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                        <div className="flex gap-2">
                          <button type="submit" className="bg-gray-900 text-white text-sm font-medium px-4 py-1.5 rounded-xl hover:bg-gray-700 transition">Save</button>
                          <button type="button" onClick={() => setEditingId(null)} className="text-sm text-gray-500 px-4 py-1.5 rounded-xl hover:bg-gray-100 transition">Cancel</button>
                        </div>
                      </form>
                    </div>
                  )
                }

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 px-5 py-3.5 transition ${isChecked ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                  >
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 transition shrink-0 cursor-pointer ${
                        isChecked ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}
                      onClick={() => toggleSelect(item.id)}
                    />
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleSelect(item.id)}>
                      <p className={`text-sm font-medium transition ${isChecked ? 'text-green-700' : 'text-gray-900'}`}>{item.name}</p>
                      {item.note && <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>}
                    </div>
                    {canEdit && (
                      <ThreeDotMenu direction="down" options={[
                        { label: 'Edit', onClick: () => setEditingId(item.id) },
                        { label: 'Delete', onClick: () => handleDelete(item.id), danger: true },
                      ]} />
                    )}
                  </div>
                )
              })}
            </div>

            {selected.size > 0 && (
              <div className="px-5 py-4 border-t border-gray-100 bg-green-50">
                <button
                  onClick={handleMarkPurchasedBatch}
                  disabled={purchasing}
                  className="w-full bg-green-600 text-white text-sm font-semibold py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50"
                >
                  {purchasing ? 'Saving…' : `I bought ${selected.size === 1 ? 'this' : `these ${selected.size} items`}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Recently purchased ── */}
      {purchased.length > 0 && (
        <PurchasedCard
          purchased={purchased}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onUnmark={handleUnmark}
          onDelete={handleDelete}
          onDeleteAll={async () => {
            const ids = purchased.map(i => i.id)
            setItems(prev => prev.filter(i => !ids.includes(i.id)))
            await Promise.all(ids.map(id => deleteSupplyItem(id)))
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
