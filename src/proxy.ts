import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always skip proxy for static assets, API routes, and internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // static files like favicon.ico, images, etc.
  ) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isPendingRoute = pathname.startsWith('/pending')

  // Not logged in — redirect to login (except auth routes)
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in — check profile status
  if (user && !isAuthRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active, is_admin')
      .eq('id', user.id)
      .single()

    if (profile && !profile.is_active && !isPendingRoute) {
      return NextResponse.redirect(new URL('/pending', request.url))
    }

    if (profile?.is_active && isPendingRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Non-admin trying to access /admin — only redirect if we confirmed they are NOT admin
    if (pathname.startsWith('/admin') && profile !== null && profile.is_admin === false) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Logged in but on auth routes — redirect away
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const proxyConfig = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
