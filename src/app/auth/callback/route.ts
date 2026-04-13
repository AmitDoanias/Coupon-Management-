import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeRedirect(next: string | null): string {
  if (!next) return "/";
  // Allow only relative paths starting with "/" and no double-slashes (prevents //evil.com redirect)
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeRedirect(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] session exchange failed");
    return NextResponse.redirect(`${origin}/login?error=auth_error`);
  }

  console.error("[auth/callback] no code in URL");
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
