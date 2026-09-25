import { NextResponse } from "next/server";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma/client";
import { releaseMaturedCommissions } from "@/lib/commissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  await releaseMaturedCommissions(affiliate.id);

  const commissionAgg = await prisma.commission.groupBy({
    by: ["status"],
    where: { affiliateId: affiliate.id },
    _sum: { amount: true },
  });
  const byStatus = (status: string) =>
    commissionAgg.find((c) => c.status === status)?._sum.amount ?? 0;

  return NextResponse.json({
    id: affiliate.id,
    name: affiliate.name,
    email: affiliate.email,
    country: affiliate.country,
    phone: affiliate.phone,
    status: affiliate.status,
    tier: affiliate.tier,
    referralCode: affiliate.referralCode,
    lifetimeRevenue: affiliate.lifetimeRevenue,
    emailVerified: affiliate.emailVerified,
    balanceAvailable: byStatus("AVAILABLE"),
    balancePending: byStatus("HOLD") + byStatus("WITHDRAWING"),
  });
}
