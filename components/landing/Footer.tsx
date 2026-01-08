"use client";

import Link from "next/link";
import Image from "next/image";
import { useDesign } from "@/lib/use-design";

const navigationLinks = [
  { href: "#funkce", label: "Funkce" },
  { href: "#jak-to-funguje", label: "Jak to funguje" },
  { href: "#cenik", label: "Ceník" },
];

const legalLinks = [
  { href: "/terms", label: "Podmínky použití" },
  { href: "/privacy", label: "Ochrana osobních údajů" },
  { href: "/cookies", label: "Cookies" },
];

export default function Footer() {
  const design = useDesign();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer
      className="py-12 md:py-16 px-5 border-t"
      style={{
        backgroundColor: design.colors.background.primary,
        borderColor: design.colors.ui.border,
        ...design.getFontFamily(),
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Main footer content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/Yumlo-Icon.png"
                alt="Yumlo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span
                className="text-xl font-bold italic"
                style={design.getTextColor()}
              >
                Yumlo
              </span>
            </Link>
            <p
              className="text-sm leading-relaxed"
              style={{ ...design.getTextColor(), opacity: 0.8 }}
            >
              Chytré plánování jídel s umělou inteligencí. Šetřete čas, peníze a
              neplýtvejte jídlem.
            </p>
          </div>

          {/* Navigation column */}
          <div>
            <h4
              className="font-bold mb-4"
              style={design.getTextColor()}
            >
              Navigace
            </h4>
            <ul className="space-y-2">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className="text-sm transition-opacity hover:opacity-70"
                    style={{ ...design.getTextColor(), opacity: 0.8 }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{ ...design.getTextColor(), opacity: 0.8 }}
                >
                  Přihlásit se
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h4
              className="font-bold mb-4"
              style={design.getTextColor()}
            >
              Právní
            </h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-opacity hover:opacity-70"
                    style={{ ...design.getTextColor(), opacity: 0.8 }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <h4
              className="font-bold mb-4"
              style={design.getTextColor()}
            >
              Kontakt
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:podpora@yumlo.cz"
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{ ...design.getTextColor(), opacity: 0.8 }}
                >
                  podpora@yumlo.cz
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/yumlo.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{ ...design.getTextColor(), opacity: 0.8 }}
                >
                  @yumlo.app
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright bar */}
        <div
          className="pt-8 border-t text-center"
          style={{ borderColor: design.colors.ui.border }}
        >
          <p
            className="text-sm"
            style={{ ...design.getTextColor(), opacity: 0.7 }}
          >
            © {new Date().getFullYear()} Yumlo. Všechna práva vyhrazena.
          </p>
        </div>
      </div>
    </footer>
  );
}
