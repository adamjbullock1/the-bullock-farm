import { NextResponse } from 'next/server'
import { sendShoppingListReminder } from '@/lib/email'

export async function GET() {
  await sendShoppingListReminder('adamjbullock1@gmail.com', 'Adam')
  return NextResponse.json({ ok: true })
}
