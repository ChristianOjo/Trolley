import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    
    // Get their role and redirect accordingly
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role;
      if (role === "operator") return NextResponse.redirect(new URL("/operator", request.url));
      if (role === "restaurant_admin") return NextResponse.redirect(new URL("/restaurant", request.url));
      if (role === "driver") return NextResponse.redirect(new URL("/driver", request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
