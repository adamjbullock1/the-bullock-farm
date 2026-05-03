'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBooking } from '@/app/actions/bookings'

type Profile = { full_name: string | null; email?: string | null; phone?: string | null }

type Booking = {
  id: string
  start_date: string
  end_date: string
  status: 'pending' | 'approved' | 'denied'
  user_id: string
  guest_name?: string | null
  note?: string | null
  profiles?: Profile | Profile[] | null
}

type Member = { id: string; full_name: string | null }

type Props = {
  bookings: Booking[]
  currentUserId: string
  isAdmin: boolean
  members?: Member[]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

function parseLocal(str: string) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getProfile(b: Booking): Profile {
  return (Array.isArray(b.profiles) ? b.profiles[0] : b.profiles) ?? {}
}

function getName(b: Booking): string {
  if (b.guest_name) return b.guest_name
  return getProfile(b).full_name || 'A family member'
}

function initials(name: string) {
  return (name.trim()[0] ?? '?').toUpperCase()
}

function formatDateRange(start: string, end: string) {
  const s = parseLocal(start)
  const e = parseLocal(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
}

function nightCount(start: string, end: string) {
  const n = Math.round((parseLocal(end).getTime() - parseLocal(start).getTime()) / 86400000)
  return `${n} night${n !== 1 ? 's' : ''}`
}

// Per-person color palette — keyed by user_id hash so the same person
// always gets the same color regardless of booking order.
const PALETTE: { bg: string; text: string; avatar: string }[] = [
  { bg: 'bg-rose-100',    text: 'text-rose-500',    avatar: 'bg-rose-400'    },
  { bg: 'bg-orange-100',  text: 'text-orange-500',  avatar: 'bg-orange-400'  },
  { bg: 'bg-amber-100',   text: 'text-amber-600',   avatar: 'bg-amber-400'   },
  { bg: 'bg-lime-100',    text: 'text-lime-600',     avatar: 'bg-lime-500'    },
  { bg: 'bg-emerald-100', text: 'text-emerald-600',  avatar: 'bg-emerald-500' },
  { bg: 'bg-teal-100',    text: 'text-teal-600',     avatar: 'bg-teal-500'    },
  { bg: 'bg-cyan-100',    text: 'text-cyan-600',     avatar: 'bg-cyan-500'    },
  { bg: 'bg-sky-100',     text: 'text-sky-600',      avatar: 'bg-sky-500'     },
  { bg: 'bg-blue-100',    text: 'text-blue-600',     avatar: 'bg-blue-500'    },
  { bg: 'bg-violet-100',  text: 'text-violet-600',   avatar: 'bg-violet-500'  },
  { bg: 'bg-purple-100',  text: 'text-purple-600',   avatar: 'bg-purple-500'  },
  { bg: 'bg-pink-100',    text: 'text-pink-500',     avatar: 'bg-pink-400'    },
]

function userColor(userId: string) {
  let h = 0
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

function StayMenu({ bookingId, onDeleted }: { bookingId: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirm(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleDelete() {
    setLoading(true)
    const result = await deleteBooking(bookingId)
    if (result?.error) {
      setErr(result.error)
      setLoading(false)
    } else {
      onDeleted()
    }
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); setConfirm(false) }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 bottom-8 z-20 w-44 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 text-sm">
          {confirm ? (
            <div className="px-3 py-2">
              <p className="text-xs text-gray-500 mb-2">Delete?</p>
              {err && <p className="text-xs text-red-500 mb-2">{err}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 bg-red-500 text-white text-xs font-medium py-1.5 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                >
                  Yes
                </button>
                <button onClick={() => setConfirm(false)} className="flex-1 text-xs text-gray-500 border border-gray-200 py-1.5 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-500 transition"
            >
              🗑 Delete Stay
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function BookingCalendar({ bookings: initialBookings, currentUserId, isAdmin, members = [] }: Props) {
  const today = new Date()
  const todayStr = toDateStr(today)

  const router = useRouter()
  const [bookings, setBookings] = useState(initialBookings)

  // Sync when server re-fetches after router.refresh()
  useEffect(() => { setBookings(initialBookings) }, [initialBookings])
  const [bookForId, setBookForId] = useState<string>(currentUserId)
  const [guestName, setGuestName] = useState('')
  const [note, setNote] = useState('')
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectStart, setSelectStart] = useState<string | null>(null)
  const [selectEnd, setSelectEnd] = useState<string | null>(null)
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [tooltip, setTooltip] = useState<{ booking: Booking; x: number; y: number } | null>(null)
  const [daysShown, setDaysShown] = useState(45)

  const approvedBookings = bookings.filter(b => b.status === 'approved')
  const pendingBookings  = bookings.filter(b => b.status === 'pending')

  const allUpcomingStays = approvedBookings
    .filter(b => b.end_date >= todayStr)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const cutoff = toDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysShown))
  const upcomingStays = allUpcomingStays.filter(b => b.start_date <= cutoff)
  const hasMore = allUpcomingStays.some(b => b.start_date > cutoff)

  const currentStays = approvedBookings.filter(
    b => b.start_date <= todayStr && b.end_date >= todayStr
  )

  const isApproved = useCallback((d: string) =>
    approvedBookings.some(b => d >= b.start_date && d < b.end_date), [approvedBookings])

  const isPending = useCallback((d: string) =>
    pendingBookings.some(b => d >= b.start_date && d < b.end_date), [pendingBookings])

  const isInSelection = useCallback((d: string) => {
    if (!selectStart) return false
    const fallback = toDateStr(new Date(parseLocal(selectStart).getTime() + 86400000))
    const cursor = selectEnd || hoverDate || fallback
    const lo = selectStart < cursor ? selectStart : cursor
    const hi = selectStart < cursor ? cursor : selectStart
    return d >= lo && d <= hi
  }, [selectStart, selectEnd, hoverDate])

  function handleDayClick(dateStr: string) {
    if (isApproved(dateStr) || isPending(dateStr)) return
    // No start yet, or clicking a new start after a complete range: reset
    if (!selectStart) {
      setSelectStart(dateStr); setSelectEnd(null); setError(''); return
    }
    // Clicking the same date as start: reset
    if (dateStr === selectStart) {
      setSelectStart(null); setSelectEnd(null); setError(''); return
    }
    // Already have a full range: start over
    if (selectEnd) {
      setSelectStart(dateStr); setSelectEnd(null); setError(''); return
    }
    // Second click: set end date
    {
      const lo = selectStart < dateStr ? selectStart : dateStr
      const hi = selectStart < dateStr ? dateStr : selectStart
      const d = parseLocal(lo), end = parseLocal(hi)
      while (d <= end) {
        const s = toDateStr(d)
        if (isApproved(s)) {
          setError('Your selection overlaps with a booked stay. Please choose different dates.')
          return
        }
        if (isPending(s)) {
          setError('Your selection overlaps with a pending request. Please choose different dates.')
          return
        }
        d.setDate(d.getDate() + 1)
      }
      setSelectEnd(dateStr); setError('')
    }
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateStr(new Date(year, month, i + 1))),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  // If only a start is picked, default end to the next day (1 night)
  const defaultEnd = selectStart
    ? toDateStr(new Date(parseLocal(selectStart).getTime() + 86400000))
    : null

  const rangeStart = selectStart
    ? (selectEnd ? (selectStart < selectEnd ? selectStart : selectEnd) : selectStart)
    : null
  const rangeEnd = selectStart
    ? (selectEnd ? (selectStart < selectEnd ? selectEnd : selectStart) : defaultEnd!)
    : null

  return (
    <div className="space-y-5">

      {/* At the farm now */}
      {currentStays.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className="text-xl">🏡</span>
          <div>
            <p className="font-semibold text-emerald-900 text-sm">At the farm right now</p>
            <p className="text-emerald-700 text-sm">{currentStays.map(getName).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-50 transition text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-base font-semibold text-gray-900">{MONTHS[month]} {year}</h3>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-50 transition text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={i} />

              const approved  = isApproved(dateStr)
              const pending   = isPending(dateStr)
              const inSel     = isInSelection(dateStr)
              const isStart   = dateStr === rangeStart
              const isEnd     = dateStr === rangeEnd
              const isToday   = dateStr === todayStr
              const isPast    = dateStr < todayStr
              const dayNum    = parseInt(dateStr.split('-')[2])

              // Determine position within a booking span for rounded ends
              const approvedB = approvedBookings.find(b => dateStr >= b.start_date && dateStr < b.end_date)
              const isBookingStart = approvedB?.start_date === dateStr
              const isBookingEnd   = approvedB ? toDateStr(new Date(parseLocal(approvedB.end_date).getTime() - 86400000)) === dateStr : false

              let bg = ''
              let textColor = ''
              let cursor = 'cursor-pointer'
              let rounded = 'rounded-xl'

              if (inSel) {
                bg = 'bg-blue-600'
                textColor = isStart || isEnd ? 'text-white font-semibold' : 'text-white'
                const dow = parseLocal(dateStr).getDay()
                const leftRound  = isStart || dow === 0
                const rightRound = isEnd   || dow === 6
                rounded = leftRound && rightRound ? 'rounded-xl'
                        : leftRound  ? 'rounded-l-xl rounded-r-none'
                        : rightRound ? 'rounded-r-xl rounded-l-none'
                        : 'rounded-none'
              } else if (approved) {
                bg = 'bg-gray-100'
                textColor = 'text-gray-400 line-through'
                cursor = 'cursor-default'
                const dow = parseLocal(dateStr).getDay()
                const leftRound  = isBookingStart || dow === 0
                const rightRound = isBookingEnd   || dow === 6
                rounded = leftRound && rightRound ? 'rounded-xl'
                        : leftRound  ? 'rounded-l-xl rounded-r-none'
                        : rightRound ? 'rounded-r-xl rounded-l-none'
                        : 'rounded-none'
              } else if (pending) {
                bg = 'bg-amber-50'
                textColor = 'text-amber-600'
                rounded = 'rounded-xl'
              } else if (isPast) {
                textColor = 'text-gray-300'
                cursor = 'cursor-not-allowed'
              } else {
                textColor = 'text-gray-800 hover:bg-gray-50'
              }

              return (
                <div
                  key={dateStr}
                  className={`relative flex items-center justify-center h-10 text-sm select-none transition ${bg} ${textColor} ${cursor} ${rounded}`}
                  onClick={() => !isPast && handleDayClick(dateStr)}
                  onMouseEnter={(e) => {
                    if (e.sourceCapabilities?.firesTouchEvents) return
                    if (approved && approvedB) {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTooltip({ booking: approvedB, x: rect.left + rect.width / 2, y: rect.top })
                    } else {
                      setTooltip(null)
                    }
                    if (selectStart && !selectEnd) setHoverDate(dateStr)
                  }}
                  onMouseLeave={(e) => {
                    if (e.sourceCapabilities?.firesTouchEvents) return
                    setHoverDate(null)
                  }}
                >
                  {isToday && !inSel && !isStart && !isEnd && !approved && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 pointer-events-none" />
                  )}
                  {dayNum}
                </div>
              )
            })}
          </div>
        </div>

        {/* Request bar */}
        {(rangeStart && rangeEnd) || error || submitted ? <div className="border-t border-gray-100 px-6 pb-5 pt-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-3">{error}</p>
            )}
            {submitted && (
              <p className="text-sm text-green-700 bg-green-50 px-4 py-3 rounded-xl mb-3">
                {isAdmin ? "✓ You're booked!" : '✓ Stay requested! An admin will review it shortly.'}
              </p>
            )}

            {rangeStart && rangeEnd ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget)
                  const res = await fetch('/api/bookings', { method: 'POST', body: fd })
                  if (res.ok) {
                    setSubmitted(true); setSelectStart(null); setSelectEnd(null); setNote('')
                    router.refresh()
                  } else {
                    const data = await res.json()
                    setError(data.error || 'Something went wrong.')
                  }
                }}
                className="space-y-2"
              >
                <input type="hidden" name="start_date" value={rangeStart} />
                <input type="hidden" name="end_date" value={rangeEnd} />
                <input type="hidden" name="user_id" value={bookForId === 'guest' ? currentUserId : bookForId} />
                {bookForId === 'guest' && <input type="hidden" name="guest_name" value={guestName} />}

                {/* Admin: book for selector */}
                {isAdmin && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Booking for</label>
                    <div className="relative">
                      <select
                        value={bookForId}
                        onChange={e => { setBookForId(e.target.value); setGuestName('') }}
                        className="w-full appearance-none border border-gray-200 rounded-xl pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                      >
                        {members.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.full_name || '(No name)'}{m.id === currentUserId ? ' (you)' : ''}
                          </option>
                        ))}
                        <option value="guest">Guest (not registered)…</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </div>
                    </div>
                    {bookForId === 'guest' && (
                      <input
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        placeholder="Guest's full name"
                        required
                        autoFocus
                        className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    )}
                  </div>
                )}

                <textarea
                  name="note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note… e.g. Coming to mow"
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-300"
                />

                <div className="flex items-center gap-3">
                  <div className="flex-1 text-sm text-gray-700 font-medium">
                    {parseLocal(rangeStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' – '}
                    {parseLocal(rangeEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    <span className="text-gray-400 font-normal ml-2">· {nightCount(rangeStart, rangeEnd)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectStart(null); setSelectEnd(null); setError('') }}
                    className="text-sm text-gray-500 hover:text-gray-900 transition px-2"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-blue-700 transition whitespace-nowrap"
                  >
                    {isAdmin ? 'Reserve' : 'Request'}
                  </button>
                </div>
              </form>
            ) : null}
        </div> : null}
      </div>

      {/* Upcoming stays */}
      {allUpcomingStays.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Upcoming Stays</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingStays.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">No stays booked in the next {daysShown} days.</p>
            ) : (
              upcomingStays.map(b => {
                const name = getName(b)
                const isMe = b.user_id === currentUserId
                const canDelete = isMe || isAdmin
                const bookerFirstName = getProfile(b).full_name?.split(' ')[0] ?? null
                return (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className={`w-8 h-8 rounded-full ${userColor(b.user_id).avatar} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {initials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {name}
                        {b.guest_name && bookerFirstName && (
                          <span className="text-gray-400 font-normal"> (booked by {isMe ? 'you' : bookerFirstName})</span>
                        )}
                        {!b.guest_name && isMe && <span className="text-gray-400 font-normal"> (you)</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDateRange(b.start_date, b.end_date)} · {nightCount(b.start_date, b.end_date)}
                      </p>
                      {b.note && (
                        <p className="text-xs text-gray-400 mt-0.5">{b.note}</p>
                      )}
                    </div>
                    {canDelete && (
                      <StayMenu
                        bookingId={b.id}
                        onDeleted={() => setBookings(prev => prev.filter(x => x.id !== b.id))}
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>
          {hasMore && (
            <button
              onClick={() => setDaysShown(d => d + 90)}
              className="w-full py-3.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-t border-gray-100 transition text-center"
            >
              Show more
            </button>
          )}
        </div>
      )}

      {/* Hover tooltip */}
      {tooltip && (() => {
        const p = getProfile(tooltip.booking)
        const name = p.full_name || 'A family member'
        return (
          <div
            className="fixed z-50 pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
          >
            <div className="bg-gray-900 text-white text-xs rounded-xl px-3.5 py-2.5 shadow-xl space-y-0.5 min-w-[160px]">
              <p className="font-semibold text-sm">{name}</p>
              <p className="text-gray-300">{formatDateRange(tooltip.booking.start_date, tooltip.booking.end_date)}</p>
              {tooltip.booking.note && <p className="text-gray-300 mt-0.5">{tooltip.booking.note}</p>}
              {p.email && <p className="text-gray-400">{p.email}</p>}
              {p.phone && <p className="text-gray-400">{p.phone}</p>}
              {!p.email && !p.phone && !tooltip.booking.note && <p className="text-gray-500 italic">No contact info</p>}
              {/* Arrow */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
            </div>
          </div>
        )
      })()}

    </div>
  )
}
