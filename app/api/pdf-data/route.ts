import { NextResponse } from "next/server";
import { getJob } from "@/lib/pdf/jobStore";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });
  const deck = getJob(token);
  if (!deck) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ deck });
}
