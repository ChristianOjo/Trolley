import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Route protection rules:
 *
 * /restaurant/** → must be authenticated with role = 'restaurant_admin'
 * /driver/**     → must be authenticated with role = 'driver'
 * /operator/**   → must be authenticated with role = 'operator'
 * /account/**    → must be authenticated (any role)
 * /              → public (customer-facing)
 * /auth/**       → public (login/signup pages)
 */

const ROLE_ROUTES: Record<string, string> = {
  "/restaurant": "restaurant_admin",
  "/driver": "driver",
  "/operator": "operator",
};

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired (IMPORTANT: don't remove this)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── Check role-protected routes ──────────────────────────────────────────
  for (const [routePrefix, requiredRole] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(routePrefix)) {
      // Not logged in → redirect to role-specific login
      if (!user) {
        return NextResponse.redirect(
          new URL(`/auth/login?redirect=${encodeURIComponent(pathname)}`, request.url)
        );
      }

      // Fetch the user's role from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== requiredRole) {
        // Wrong role → redirect to appropriate home or generic unauthorised page
        return NextResponse.redirect(new URL("/auth/unauthorised", request.url));
      }

      break;
    }
  }

  // ── Protect /account routes ───────────────────────────────────────────────
  if (pathname.startsWith("/account") && !user) {
    return NextResponse.redirect(
      new URL(`/auth/login?redirect=${encodeURIComponent(pathname)}`, request.url)
    );
  }

  // ── Redirect logged-in users away from auth pages ────────────────────────
  if (pathname.startsWith("/auth/login") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile) {
      const homeMap: Record<string, string> = {
        restaurant_admin: "/restaurant",
        driver: "/driver",
        operator: "/operator",
        customer: "/",
      };
      return NextResponse.redirect(
        new URL(homeMap[profile.role] ?? "/", request.url)
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
