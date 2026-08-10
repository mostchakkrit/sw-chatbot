import ChatWidget from "@/components/ChatWidget";
import FeatureCard from "@/components/FeatureCard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-base-200">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-12">
        <section className="grid gap-8 sm:grid-cols-2 sm:items-center">
          <div
            className="flex aspect-square items-center justify-center rounded-box bg-gradient-to-br from-primary to-primary-content/20 text-8xl"
            style={{ boxShadow: "var(--flip7-shadow-teal-glow)" }}
          >
            🎧
          </div>
          <div className="flex flex-col gap-4">
            <span className="badge badge-secondary w-fit gap-1 py-3 font-bold">✨ ขายดีอันดับ 1</span>
            <h1 className="text-4xl font-extrabold text-base-content">SoundWave Pro</h1>
            <p className="text-base-content/70">
              หูฟังไร้สายตัดเสียงรบกวน เสียงกระหึ่ม แบตอึด ใส่สบายทั้งวัน เหมาะกับทั้งทำงานและออกกำลังกาย
            </p>
            <p className="text-3xl font-extrabold text-primary">฿1,990</p>
            <button
              type="button"
              className="btn btn-secondary w-fit rounded-full px-8 font-bold"
              style={{ boxShadow: "var(--flip7-shadow-accent-glow)" }}
            >
              สั่งซื้อเลย
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <FeatureCard icon="🔋" title="แบตอึด 32 ชม." description="ใช้งานต่อเนื่อง 8 ชม. รวมเคสชาร์จได้สูงสุด 32 ชม." accent="primary" />
          <FeatureCard icon="🔇" title="ตัดเสียงรบกวน ANC" description="โฟกัสได้เต็มที่ พร้อมโหมด Ambient Sound ฟังเสียงรอบข้าง" accent="accent" />
          <FeatureCard icon="📶" title="Bluetooth 5.3" description="เชื่อมต่อเสถียร รองรับ 2 อุปกรณ์พร้อมกัน (multipoint)" accent="info" />
          <FeatureCard icon="💧" title="กันน้ำกันเหงื่อ IPX4" description="เหมาะกับการออกกำลังกาย ใช้งานกลางแจ้งได้สบาย" accent="primary" />
        </section>

        <section
          className="rounded-box bg-base-100 p-6"
          style={{ boxShadow: "var(--flip7-shadow-card)" }}
        >
          <h2 className="mb-2 border-b-2 border-dashed border-base-300 pb-2 text-lg font-extrabold">
            🛎️ มีคำถาม? คุยกับผู้ช่วยของเราได้เลย
          </h2>
          <p className="text-sm text-base-content/70">
            กดปุ่มแชทมุมล่างขวา ถามเรื่องการจัดส่ง ประกันสินค้า แบตเตอรี่ หรือเรื่องอื่นๆ ได้ตลอด 24 ชั่วโมง
            หากตอบไม่ได้ระบบจะส่งต่อให้เจ้าหน้าที่ดูแลต่อทันที
          </p>
        </section>
      </main>
      <ChatWidget />
    </div>
  );
}
