interface VercelProject {
  name: string;
  link?: { type: string; repo?: string };
  targets?: {
    production?: {
      alias?: string[];
      url?: string;
    };
  };
}

interface VercelProjectsResponse {
  projects: VercelProject[];
}

/**
 * Obtiene las URLs de producción de los proyectos del equipo en Vercel y las
 * mapea por nombre de repositorio de GitHub (ej. "Caskiuz/mi-app" → "mi-app").
 * Retorna un mapa vacío si no hay VERCEL_TOKEN o si la API falla, para que el
 * frontend siga funcionando solo con el campo "homepage" de GitHub.
 */
export async function getVercelDemoUrls(): Promise<Record<string, string>> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return {};

  try {
    const res = await fetch("https://api.vercel.com/v9/projects?limit=100", {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 }, // Los deployments cambian poco; cache 1 hora
    });

    if (!res.ok) return {};

    const data = (await res.json()) as VercelProjectsResponse;
    const map: Record<string, string> = {};

    for (const project of data.projects ?? []) {
      const alias =
        project.targets?.production?.alias?.[0] ?? project.targets?.production?.url;
      if (!alias) continue;

      const url = /^https?:\/\//.test(alias) ? alias : `https://${alias}`;
      // Repo vinculado desde GitHub; si no hay link, usar el nombre del proyecto
      const key = (project.link?.repo?.split("/").pop() ?? project.name).toLowerCase();
      map[key] = url;
    }

    return map;
  } catch {
    return {};
  }
}
