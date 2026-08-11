"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ShowcaseItem {
  name: string;
  swatch: string;
  image: string;
}

const ROTATE_MS = 4200;

export default function HeroShowcase({ items }: { items: ShowcaseItem[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || reducedMotion.current || items.length < 2) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, items.length]);

  return (
    <div
      className="flex flex-col items-center gap-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="relative aspect-square w-full max-w-[19rem] rounded-full"
        style={{ boxShadow: "0 12px 44px rgb(43 168 162 / 0.4)" }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-full bg-gradient-to-br from-primary/25 via-secondary/10 to-accent/10">
          {items.map((item, i) => (
            <div
              key={item.name}
              aria-hidden={i !== active}
              className="absolute inset-0 transition-[opacity,transform] duration-700 ease-out"
              style={{
                opacity: i === active ? 1 : 0,
                transform: i === active ? "scale(1)" : "scale(1.04)",
              }}
            >
              <Image
                src={item.image}
                alt={`หูฟังไร้สาย SoundWave Pro สี ${item.name}`}
                fill
                priority={i === 0}
                sizes="(max-width: 640px) 90vw, 304px"
                className="object-contain p-7 sm:p-9"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3" role="tablist" aria-label="เลือกสีหูฟังที่แสดง">
        {items.map((item, i) => (
          <button
            key={item.name}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={item.name}
            onClick={() => setActive(i)}
            className="group flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            style={{
              backgroundColor: i === active ? "var(--flip7-cream)" : "transparent",
              boxShadow: i === active ? "var(--flip7-shadow-card)" : "none",
            }}
          >
            <span
              className="h-5 w-5 rounded-full border-2 transition-transform group-hover:scale-110"
              style={{
                backgroundColor: item.swatch,
                borderColor: i === active ? "var(--color-primary)" : "transparent",
              }}
            />
            <span
              className={`text-xs font-bold transition-colors ${
                i === active ? "text-base-content" : "text-base-content/50"
              }`}
            >
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
