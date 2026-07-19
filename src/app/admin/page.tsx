import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let pendingMessages = 0;
  let subscribers = 0;
  let publishedPosts = 0;
  let dbError: string | null = null;

  try {
    [pendingMessages, subscribers, publishedPosts] = await Promise.all([
      prisma.contact.count({ where: { read: false } }),
      prisma.subscriber.count({ where: { active: true } }),
      prisma.blogPost.count({ where: { published: true } }),
    ]);
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error);
    const msg =
      error instanceof Error ? error.message : JSON.stringify(error);
    dbError = `Error: ${msg}`;
  }

  return (
    <div className="min-h-screen pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Admin Panel
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Panel de <span className="gradient-text">Administración</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Gestiona los mensajes de contacto, suscriptores y contenido del
            blog.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 text-center">
            <div className="text-4xl font-bold gradient-text mb-2">
              {pendingMessages}
            </div>
            <div className="text-sm font-medium">Mensajes Pendientes</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-4xl font-bold gradient-text mb-2">
              {subscribers}
            </div>
            <div className="text-sm font-medium">Suscriptores</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-4xl font-bold gradient-text mb-2">
              {publishedPosts}
            </div>
            <div className="text-sm font-medium">Posts Publicados</div>
          </div>
        </div>

        {dbError ? (
          <div className="mt-12 glass-card p-8 text-center border-red-500/30">
            <h2 className="text-xl font-bold mb-4">
              ⚠️ Error de conexión
            </h2>
            <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
              {dbError}
            </p>
            <div className="inline-block text-left bg-surface border border-border rounded-xl p-4 text-sm font-mono">
              npx prisma db push
            </div>
          </div>
        ) : (
          <div className="mt-12 glass-card p-8 text-center">
            <h2 className="text-xl font-bold mb-4">
              ✅ Base de datos conectada
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              La conexión a la base de datos MySQL en Aiven funciona
              correctamente. Los datos se están leyendo y escribiendo sin
              problemas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}