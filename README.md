# 🚀 Caskiuz Portfolio

Web profesional full-stack para captación de clientes freelance. Diseño moderno con Glassmorphism, Bento Grid, animaciones Framer Motion y blog con MDX.

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel)](https://caskiuz.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma)](https://prisma.io)
[![MySQL](https://img.shields.io/badge/MySQL-Aiven-4479A1?style=flat&logo=mysql)](https://aiven.io)

---

## ✨ Features

- 🎨 **Diseño profesional** — Glassmorphism, Bento Grid, Dark/Light mode
- ⚡ **Next.js 14** — App Router, Server Components, Turbopack
- 🎬 **Animaciones** — Framer Motion con scroll reveals y parallax
- 📂 **Proyectos automáticos** — Sincronización con GitHub API en tiempo real
- 📝 **Blog MDX** — Markdown + componentes React + SEO completo
- 📞 **WhatsApp Directo** — Botón flotante con mensaje predefinido
- 📧 **Formulario de contacto** — Guarda leads en MySQL (Aiven)
- 📊 **Newsletter** — Sistema de suscripciones
- 🖥️ **Panel Admin** — Dashboard para gestionar mensajes y suscriptores
- 🔍 **SEO** — Sitemap, Robots.txt, Open Graph, Schema.org
- 🗄️ **Base de datos** — MySQL en Aiven con Prisma ORM

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Lenguaje** | TypeScript |
| **Estilos** | TailwindCSS 4 |
| **Animaciones** | Framer Motion |
| **Iconos** | Lucide React |
| **Blog** | MDX + remark-gfm |
| **ORM** | Prisma |
| **Base de datos** | MySQL (Aiven) |
| **Email** | Resend (próximamente) |
| **Hosting** | Vercel |
| **Analytics** | Umami (próximamente) |

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout + SEO
│   ├── globals.css                 # Sistema de diseño (variables CSS, animaciones)
│   ├── sitemap.ts                  # Sitemap XML dinámico
│   ├── robots.ts                   # Robots.txt
│   ├── blog/
│   │   ├── page.tsx                # Blog index (5 artículos)
│   │   ├── layout.tsx              # Metadata del blog
│   │   └── [slug]/page.tsx         # Post dinámico
│   ├── admin/page.tsx              # Panel de administración
│   └── api/
│       ├── contact/route.ts        # POST → guarda en BD
│       ├── subscribe/route.ts      # POST → newsletter
│       └── github/route.ts         # GET → proxy GitHub API
├── components/
│   ├── layout/                     # Header, Footer
│   ├── sections/                   # Hero, Projects, Services, TechStack, About, Contact
│   ├── ui/                         # WhatsAppButton
│   ├── mdx/                        # MDX Components personalizados
│   └── theme-provider.tsx          # Dark/Light mode
└── lib/
    ├── utils.ts                    # cn() helper
    └── prisma/
        └── client.ts               # Singleton Prisma
```

---

## 🚀 Instalación y Desarrollo

```bash
# 1. Clonar
git clone https://github.com/Caskiuz/caskiuz.git
cd caskiuz

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL de Aiven

# 4. Sincronizar base de datos
npx prisma db push

# 5. Iniciar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🗄️ Base de Datos

El proyecto usa **MySQL en Aiven** (plan gratuito). El schema de Prisma define 4 modelos:

| Modelo | Tabla | Descripción |
|---|---|---|
| Contact | contacts | Mensajes del formulario |
| Subscriber | subscribers | Suscripciones al newsletter |
| BlogPost | blog_posts | Artículos del blog |
| Project | projects | Proyectos del portafolio |

### Sincronizar schema:

```bash
npx prisma db push          # Crear/actualizar tablas
npx prisma studio           # UI para explorar datos
```

---

## 🌐 Despliegue en Vercel

El proyecto está configurado para deploy automático en cada push a `main`.

1. Conecta el repo a [Vercel](https://vercel.com)
2. Agrega las variables de entorno:
   ```
   DATABASE_URL=mysql://...
   ```
3. Deploy automático en cada `git push`

---

## 📬 API Routes

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/contact` | Guarda mensaje de contacto |
| POST | `/api/subscribe` | Suscribe email al newsletter |
| GET | `/api/github` | Proxy de GitHub API (repos) |

---

## 🎨 Diseño

El sistema de diseño usa variables CSS personalizadas para ambos temas:

- **Dark mode** (default): fondo `#0a0a0f`, primario `#6C5CE7`, secundario `#00D2FF`
- **Light mode**: fondo `#fafafa`, primario `#5B4CC4`, secundario `#0099CC`

Las cards usan `backdrop-filter: blur(16px)` para el efecto glassmorphism.

---

## 📝 Licencia

MIT © Caskiuz

---

<div align="center">

**[🌐 Ver Portfolio](https://caskiuz.vercel.app)** &nbsp;|&nbsp; **[💬 WhatsApp](https://wa.me/584262931869)** &nbsp;|&nbsp; **[📧 Email](mailto:hola@caskiuz.dev)**

</div>