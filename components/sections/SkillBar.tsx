"use client";

import { useEffect, useRef, useState } from "react";

type SkillBarProps = {
  name: string;
  progress: number;
};

export function SkillBar({ name, progress }: SkillBarProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="skill-item" ref={ref}>
      <span className="skill-name">{name}</span>
      <div className="skill-bar">
        <div
          className="skill-progress"
          style={{
            width: visible ? `${progress}%` : 0,
          }}
        />
      </div>
    </div>
  );
}
