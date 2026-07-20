import Link from "next/link";
import { Zap, Globe, Briefcase, MessageSquare, Mail, Heart } from "lucide-react";

interface FooterProps {
  config?: Record<string, string>;
}

const footerLinks = {
  navegación: [
    { href: "/#home", label: "Inicio" },
    { href: "/#projects", label: "Proyectos" },
    { href: "/#services", label: "Servicios" },
    { href: "/#about", label: "Sobre mí" },
  ],
  recursos: [
    { href: "/blog", label: "Blog" },
    { href: "/#contact", label: "Contacto" },
  ],
};

export function Footer({ config = {} }: FooterProps) {
  const c = (key: string, fallback: string) => config[key] || fallback;

  const socialLinks = [
    { href: c("social_github_url", "https://github.com/caskiuz"), icon: Globe, label: c("social_github_label", "GitHub") },
    { href: c("social_linkedin_url", "https://www.linkedin.com/in/ricardo-agelvis-9489a9370"), icon: Briefcase, label: c("social_linkedin_label", "LinkedIn") },
    { href: c("social_twitter_url", ""), icon: MessageSquare, label: c("social_twitter_label", "Twitter") },
    { href: c("social_instagram_url", "") || `mailto:${c("contact_email", "rijarwow@gmail.com")}`, icon: Mail, label: c("social_instagram_label", "Email") },
  ].filter((s) => s.href);

  return (
    <footer className="relative border-t border-border bg-surface/50 backdrop-blur-sm">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/#home" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">
                <span className="gradient-text">Caskiuz</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Full-Stack Developer & Software Architect. Construyendo el futuro, una
              línea de código a la vez.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3 mt-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-surface-hover transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-sm mb-4 capitalize">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact CTA */}
          <div>
            <h3 className="font-semibold text-sm mb-4">¿Listo para trabajar?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cuéntame tu idea y la convertimos en realidad.
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-full transition-all duration-200 shadow-lg shadow-primary/25"
            >
              ¡Hablemos! 💬
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {c("footer_copyright", `© ${new Date().getFullYear()} Caskiuz. Todos los derechos reservados.`)}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {c("footer_built_with", "Hecho con")} <Heart className="w-3 h-3 text-accent fill-accent" />
          </p>
        </div>
      </div>
    </footer>
  );
}