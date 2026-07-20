import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { verifyToken } from "@/lib/auth";
import { getAllConfigs, upsertConfigs } from "@/lib/site-config";

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token || !(await verifyToken(token))) return unauthorized();

  const configs = await getAllConfigs();
  return NextResponse.json({ configs });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token || !(await verifyToken(token))) return unauthorized();

  const body = await request.json();

  if (!Array.isArray(body.configs)) {
    return NextResponse.json(
      { error: "Se requiere un array de configs" },
      { status: 400 }
    );
  }

  for (const entry of body.configs) {
    if (!entry.key || entry.value === undefined || !entry.group) {
      return NextResponse.json(
        { error: "Cada entrada requiere key, value y group" },
        { status: 400 }
      );
    }
  }

  await upsertConfigs(body.configs);

  // Purgar la caché de la página y el layout para reflejar los cambios inmediatamente
  revalidatePath("/", "layout");
  revalidatePath("/", "page");

  return NextResponse.json({ success: true });
}