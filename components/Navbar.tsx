"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/data";

function sectionIdFromHref(href: string): string | null {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return null;
  return href.slice(hashIndex + 1);
}

export function Navbar() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("home");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  const updateActiveSection = useCallback(() => {
    const sections = document.querySelectorAll<HTMLElement>("section[id]");
    const scrollPosition = window.scrollY + 150;

    for (const section of sections) {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        setActiveSection(section.id);
        break;
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      updateActiveSection();
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [updateActiveSection]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
      if (!menuOpen) return;
      if (target.closest("#nav-menu") || target.closest("#nav-toggle")) return;
      setMenuOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`} id="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo" aria-label="Home" onClick={closeMenu}>
          <Image
            src="/branding.png"
            alt="Steven Simbolon Logo"
            width={160}
            height={40}
            priority
            style={{ height: 40, width: "auto" }}
          />
        </Link>

        <button
          className={`nav-toggle${menuOpen ? " active" : ""}`}
          id="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <ul className={`nav-menu${menuOpen ? " active" : ""}`} id="nav-menu">
          {navItems.map((item) => {
            if (item.kind === "dropdown") {
              const isDropdownActive =
                isHomePage &&
                item.children.some((child) => sectionIdFromHref(child.href) === activeSection);
              return (
                <li key={item.label} className="nav-dropdown-wrapper" ref={dropdownRef}>
                  <button
                    className={`nav-link nav-dropdown-trigger${isDropdownActive ? " active" : ""}${dropdownOpen ? " open" : ""}`}
                    aria-expanded={dropdownOpen}
                    onClick={() => setDropdownOpen((o) => !o)}
                  >
                    {item.label}
                    <svg
                      className="nav-dropdown-chevron"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <ul className={`nav-dropdown${dropdownOpen ? " open" : ""}`}>
                    {item.children.map((child) => {
                      const id = sectionIdFromHref(child.href);
                      const isActive = isHomePage && id !== null && activeSection === id;
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={`nav-dropdown-item${isActive ? " active" : ""}`}
                            onClick={closeMenu}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            }

            const isPathActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-link${isPathActive ? " active" : ""}`}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
