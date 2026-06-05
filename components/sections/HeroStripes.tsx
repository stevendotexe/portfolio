"use client";

import { useEffect, useState } from "react";

export function HeroStripes() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY * 0.3);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="hero-stripes"
      style={{ transform: `translateY(${offset}px)` }}
      aria-hidden="true"
    />
  );
}
