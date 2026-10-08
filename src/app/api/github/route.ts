import { NextResponse } from "next/server";
import { getVercelDemoUrls } from "@/lib/vercel";

interface GitHubRepo {
  name: string;
  homepage: string | null;
  [key: string]: unknown;
}

// Correcciones manuales para cuando el campo "Website" del repo quedó desactualizado
// (ej. rifasv2: su homepage en GitHub apunta a un deployment eliminado).
const demoUrlOverrides: Record<string, string> = {
  rifasv2: "https://rifasv2-two.vercel.app",
};

export async function GET() {
  try {
    const res = await fetch(
      "https://api.github.com/users/Caskiuz/repos?per_page=100&sort=pushed",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
        next: { revalidate: 300 }, // Cache 5 minutos
      }
    );

    if (!res.ok) throw new Error("GitHub API error");

    const repos = (await res.json()) as GitHubRepo[];
    const vercelUrls = await getVercelDemoUrls();

    // Enriquecer cada repo con su URL de demo en vivo: overrides manuales primero,
    // luego el campo "Website" de GitHub y por último el deployment en Vercel.
    const enriched = repos.map((repo) => ({
      ...repo,
      demoUrl:
        demoUrlOverrides[repo.name] ||
        repo.homepage ||
        vercelUrls[repo.name.toLowerCase()] ||
        null,
    }));

    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json(
      { error: "No se pudieron cargar los repositorios" },
      { status: 500 }
    );
  }
}
