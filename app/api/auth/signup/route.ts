import { NextRequest, NextResponse } from "next/server";
import { createAuroraClient } from "aurora-starter-core";

/** App user sign up via SDK (API key server-side). Returns session or user + message when email confirmation required. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, options } = body ?? {};
    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }
    const client = createAuroraClient();
    const result = await client.auth.signup({
      email,
      password,
      options: options ?? undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sign up failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
