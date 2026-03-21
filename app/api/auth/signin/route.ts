import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "aurora-starter-core";

/** App user sign in via SDK (API key server-side). Returns session with access_token. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};
    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }
    const client = createAuroraClient();
    const session = await client.auth.signin({ email, password });
    return NextResponse.json(session);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sign in failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
