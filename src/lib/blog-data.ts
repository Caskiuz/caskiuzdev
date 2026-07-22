export interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    title: "Por qué Next.js es el mejor framework para freelancers en 2025",
    slug: "nextjs-mejor-framework-freelancers",
    excerpt:
      "Descubre por qué Next.js se ha convertido en la herramienta favorita de los desarrolladores freelance para construir aplicaciones web modernas, rápidas y con SEO imbatible.",
    date: "2025-07-15",
    readTime: "6 min",
    tags: ["Next.js", "React", "Freelance"],
    content: `# Por qué Next.js es el mejor framework para freelancers en 2025

Si eres un desarrollador freelance, elegir el framework correcto puede marcar la diferencia entre
entregar proyectos a tiempo y con calidad, o pasar horas configurando tooling.

## La ventaja del Server-Side Rendering

Next.js ofrece SSR, SSG e ISR en un solo framework. Esto significa que puedes elegir la
estrategia de renderizado correcta para cada página de tu aplicación:

- **SSG (Static Site Generation):** Perfecto para landing pages y blogs que no cambian frecuentemente.
- **SSR (Server-Side Rendering):** Ideal para dashboards y contenido dinámico.
- **ISR (Incremental Static Regeneration):** Lo mejor de ambos mundos para contenido que cambia ocasionalmente.

## Productividad desde el día 1

Con Next.js obtienes:

1. **File-based routing** — sin necesidad de configurar un router
2. **API Routes** — backend integrado sin servidor separado
3. **TypeScript** — soporte nativo desde la instalación
4. **Optimización de imágenes** — componente Image integrado
5. **Middleware** — para auth, redirecciones, y más

## Entrega más rápido, cobra más

Como freelancer, tu tiempo es dinero. Next.js te permite:

- **Reutilizar componentes** entre proyectos con un sistema de diseño consistente
- **Desplegar en Vercel** con un solo comando (\`git push\`)
- **Ofrecer mejor SEO** que con SPAs tradicionales (los clientes lo valoran)
- **Escalar sin cambiar de stack** cuando el proyecto crece

## Conclusión

Next.js no es solo una moda pasajera. Es el estándar de facto para desarrollo React moderno
y la mejor inversión de aprendizaje para cualquier freelancer en 2025.`,
  },
  {
    title: "Guía completa de Prisma ORM con MySQL para proyectos reales",
    slug: "prisma-orm-mysql-guia-completa",
    excerpt:
      "Aprende a configurar Prisma con MySQL desde cero, con ejemplos prácticos de migraciones, relaciones, consultas avanzadas y mejores prácticas para producción.",
    date: "2025-06-28",
    readTime: "10 min",
    tags: ["Prisma", "MySQL", "Backend"],
    content: `# Guía completa de Prisma ORM con MySQL

Prisma ha revolucionado la forma en que trabajamos con bases de datos en Node.js. En esta guía
aprenderás a configurarlo con MySQL para proyectos reales.

## Instalación y configuración inicial

\`\`\`bash
npm install prisma @prisma/client
npx prisma init --datasource-provider mysql
\`\`\`

Esto crea un archivo \`schema.prisma\` donde definiremos nuestros modelos:

\`\`\`prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
}
\`\`\`

## Migraciones

Prisma gestiona las migraciones por ti:

\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

## Consultas type-safe

El verdadero poder de Prisma está en sus consultas completamente tipadas:

\`\`\`typescript
const users = await prisma.user.findMany({
  include: { posts: true },
  where: { email: { contains: "@gmail.com" } },
});
\`\`\`

## Conclusión

Prisma + MySQL es la combinación perfecta para proyectos que necesitan type safety,
migraciones automáticas y un DX excepcional.`,
  },
  {
    title: "Arquitectura limpia en Node.js: cómo estructurar tus APIs",
    slug: "arquitectura-limpia-nodejs-apis",
    excerpt:
      "Un enfoque práctico para aplicar Clean Architecture en tus proyectos Node.js/Express, con separación de responsabilidades, inyección de dependencias y testing.",
    date: "2025-06-10",
    readTime: "8 min",
    tags: ["Node.js", "API", "Arquitectura"],
    content: `# Arquitectura limpia en Node.js

La arquitectura limpia, popularizada por Robert C. Martin, no es exclusiva de lenguajes
empresariales como Java. En Node.js también podemos aplicarla con excelentes resultados.

## Principios fundamentales

- **Independencia de frameworks:** Tu lógica de negocio no debe depender de Express o Fastify
- **Testable:** La arquitectura debe facilitar el testing unitario
- **Independiente de UI:** La misma lógica debe funcionar con REST, GraphQL o CLI
- **Independiente de base de datos:** Cambiar de MySQL a MongoDB no debería romper tu negocio

## Capas de la arquitectura

1. **Entities / Domain** — Reglas de negocio puras
2. **Use Cases / Application** — Casos de uso que orquestan entidades
3. **Interface Adapters** — Controllers, gateways, presenters
4. **Frameworks & Drivers** — Express, Prisma, etc.

## Beneficios en Node.js

- Migrar de Express a Fastify es trivial
- Tests unitarios ultrarrápidos (sin levantar servidor)
- Nuevos desarrolladores entienden el código en minutos
- Reutilización de lógica entre API REST y WebSocket`,
  },
  {
    title: "10 patrones de React que todo desarrollador debería conocer",
    slug: "10-patrones-react-esenciales",
    excerpt:
      "Explora patrones avanzados de React como Compound Components, Render Props, Higher-Order Components, Custom Hooks y cómo aplicarlos en proyectos reales.",
    date: "2025-05-20",
    readTime: "12 min",
    tags: ["React", "TypeScript", "Patrones"],
    content: `# 10 patrones de React que todo desarrollador debería conocer

React tiene un ecosistema maduro lleno de patrones probados. Conocerlos te hará
un desarrollador más eficiente y tu código más mantenible.

## 1. Compound Components

Permite crear componentes que trabajan juntos de forma implícita, compartiendo
estado sin necesidad de prop drilling.

## 2. Render Props

Compartir lógica entre componentes pasando una función como prop.

## 3. Higher-Order Components (HOC)

Funciones que reciben un componente y retornan uno nuevo con funcionalidad añadida.

## 4. Custom Hooks

La forma moderna de reutilizar lógica de estado en React.

## 5. Provider Pattern

Usa Context API para compartir estado global sin prop drilling excesivo.

## 6. Container/Presenter

Separa la lógica de negocio de la presentación visual.

## 7. State Reducer

Centraliza la lógica de actualización de estado complejo.

## 8. Controlled vs Uncontrolled

Entiende cuándo controlar el estado de un componente y cuándo delegarlo al DOM.

## 9. Composition over Inheritance

React favorece la composición de componentes sobre la herencia de clases.

## 10. Error Boundaries

Captura errores en el árbol de componentes para evitar crash completos.`,
  },
  {
    title: "Cómo conseguir clientes internacionales siendo freelancer latino",
    slug: "clientes-internacionales-freelance-latino",
    excerpt:
      "Estrategias probadas para posicionarte en el mercado global, construir tu marca personal, y conseguir clientes en USA y Europa desde Latinoamérica.",
    date: "2025-05-05",
    readTime: "7 min",
    tags: ["Freelance", "Negocios", "Carrera"],
    content: `# Cómo conseguir clientes internacionales siendo freelancer latino

Trabajar para clientes en USA y Europa desde Latinoamérica no es un sueño imposible.
Con las estrategias correctas, puedes construir una cartera de clientes internacional
que te pague en dólares o euros.

## Construye tu marca personal

- **Portfolio impecable:** Tu sitio web es tu carta de presentación. Invierte tiempo en él.
- **GitHub activo:** Contribuciones, proyectos propios, y código limpio hablan por ti.
- **LinkedIn optimizado:** Perfil en inglés, keywords relevantes, y actividad constante.

## Dónde encontrar clientes

1. **Upwork y Toptal** — Plataformas con clientes verificados
2. **Twitter/X y LinkedIn** — Networking directo con founders y CTOs
3. **Comunidades tech** — Discord, Slack, y foros especializados
4. **Referidos** — El mejor canal una vez que tienes 2-3 clientes satisfechos

## Diferenciadores clave

- **Inglés profesional** — No necesitas ser nativo, pero sí comunicarte con fluidez
- **Zona horaria compatible** — LatAm comparte husos con USA, ventaja sobre Asia/Europa del Este
- **Calidad sobre precio** — No compitas por ser el más barato, compite por ser el mejor
- **Especialización** — Ser "full-stack" está bien, pero tener un nicho paga mejor`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return blogPosts.map((p) => p.slug);
}