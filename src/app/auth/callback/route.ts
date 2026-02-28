import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  if (token_hash && type) {
    await supabase.auth.verifyOtp({ token_hash, type: type as any });
  } else if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

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

  return NextResponse.redirect(new URL("/", request.url));
}
```

Then in **Supabase → Authentication → URL Configuration** make sure Redirect URLs has:
```
https://trolley-omega.vercel.app/**

  return NextResponse.redirect(new URL(next, request.url));
}
