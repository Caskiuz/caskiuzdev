import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { verifyPurposeToken } from "@/lib/affiliate-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const failUrl = new URL("/afiliados/login?verificado=0", request.url);
  const okUrl = new URL("/afiliados/login?verificado=1", request.url);

  if (!token) return NextResponse.redirect(failUrl);

  const email = await verifyPurposeToken(token, "verify");
  if (!email) return NextResponse.redirect(failUrl);

  try {
    await prisma.affiliate.update({
      where: { email },
      data: { emailVerified: true },
    });
    return NextResponse.redirect(okUrl);
  } catch {
    return NextResponse.redirect(failUrl);
  }
}
