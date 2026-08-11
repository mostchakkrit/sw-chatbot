"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BatteryCharging,
  Bluetooth,
  Droplets,
  Headphones,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  VolumeX,
} from "lucide-react";
import ChatWidget from "@/components/ChatWidget";
import FeatureCard from "@/components/FeatureCard";
import HeroShowcase from "@/components/HeroShowcase";

const TRUST_BADGES = [
  { icon: Truck, label: "ส่งฟรี", sub: "ครบ 500 บาท" },
  { icon: ShieldCheck, label: "รับประกัน", sub: "1 ปีเต็ม" },
  { icon: RotateCcw, label: "คืนสินค้าได้", sub: "ภายใน 7 วัน" },
  { icon: Star, label: "รีวิว 4.9", sub: "จาก 2,300+ คน" },
];

const GALLERY = [
  {
    name: "Midnight Black",
    swatch: "#1c1c1c",
    image: "/headphone/back.png",
  },
  {
    name: "Ivory Gold",
    swatch: "#e8dcc4",
    image: "/headphone/white.png",
  },
];

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col bg-base-200">
      <header className="sticky top-0 z-40 border-b border-base-300 bg-base-100/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-extrabold text-base-content">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-content">
              <Headphones size={18} />
            </span>
            SoundWave
          </div>
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="btn btn-secondary btn-sm rounded-full px-5 font-bold"
          >
            สั่งซื้อเลย
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-5 px-6 py-5">
        <section
          className="grid gap-6 rounded-box p-5 sm:grid-cols-2 sm:items-center sm:p-6"
          style={{
            background:
              "radial-gradient(38rem 30rem at -6% -18%, rgb(255 210 63 / 0.45), transparent 60%), radial-gradient(34rem 30rem at 112% 8%, rgb(239 108 74 / 0.3), transparent 58%), var(--color-base-100)",
            boxShadow: "var(--flip7-shadow-teal-glow)",
          }}
        >
          <div className="flex flex-col gap-3">
            <span className="badge badge-secondary w-fit gap-1 py-3 font-bold">
              <Sparkles size={14} /> ขายดีอันดับ 1
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-base-content sm:text-5xl">
              SoundWave Pro
            </h1>
            <p className="text-base-content/70">
              หูฟังไร้สายตัดเสียงรบกวน เสียงกระหึ่ม แบตอึด ใส่สบายทั้งวัน เหมาะกับทั้งทำงานและออกกำลังกาย
            </p>
            <p
              className="w-fit rounded-full bg-primary px-5 py-1.5 text-3xl font-extrabold text-primary-content"
              style={{ boxShadow: "var(--flip7-shadow-coral-glow)" }}
            >
              ฿1,990
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="btn btn-secondary rounded-full px-8 font-bold"
                style={{ boxShadow: "var(--flip7-shadow-accent-glow)" }}
              >
                สั่งซื้อเลย
              </button>
              <div className="flex items-center gap-1.5 text-sm text-base-content/60">
                <Truck size={16} /> ส่งฟรีเมื่อสั่งซื้อครบ 500 บาท
              </div>
            </div>
          </div>

          <HeroShowcase items={GALLERY} />
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-box bg-base-100 p-3 text-center"
              style={{ boxShadow: "var(--flip7-shadow-card)" }}
            >
              <Icon size={20} className="text-primary" />
              <span className="text-sm font-bold text-base-content">{label}</span>
              <span className="text-xs text-base-content/60">{sub}</span>
            </div>
          ))}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <FeatureCard icon={BatteryCharging} title="แบตอึด 32 ชม." description="ใช้งานต่อเนื่อง 8 ชม. รวมเคสชาร์จได้สูงสุด 32 ชม." accent="primary" />
          <FeatureCard icon={VolumeX} title="ตัดเสียงรบกวน ANC" description="โฟกัสได้เต็มที่ พร้อมโหมด Ambient Sound ฟังเสียงรอบข้าง" accent="accent" />
          <FeatureCard icon={Bluetooth} title="Bluetooth 5.3" description="เชื่อมต่อเสถียร รองรับ 2 อุปกรณ์พร้อมกัน (multipoint)" accent="info" />
          <FeatureCard icon={Droplets} title="กันน้ำกันเหงื่อ IPX4" description="เหมาะกับการออกกำลังกาย ใช้งานกลางแจ้งได้สบาย" accent="primary" />
        </section>
      </main>
      <ChatWidget open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
