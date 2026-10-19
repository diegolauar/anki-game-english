import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}
