// One-off script: push FAQs that exist locally but not on prod, via the admin API.
// Usage (from repo root):
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword BASE_URL=https://13-239-164-244.sslip.io node backend/scripts/sync-faqs-to-prod.mjs

const BASE_URL = process.env.BASE_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!BASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing BASE_URL, ADMIN_EMAIL, or ADMIN_PASSWORD env vars');
  process.exit(1);
}

const missingFaqs = [
  { category: 'fit', question: 'จุกหูฟังมีกี่ขนาด เปลี่ยนได้ไหม', content: 'มีจุกยางให้เลือก 3 ขนาด (S/M/L) แถมมาในกล่อง สามารถถอดเปลี่ยนเองได้เพื่อความกระชับและกันเสียงรั่วที่ดีขึ้น' },
  { category: 'order-tracking', question: 'เช็คสถานะพัสดุยังไง', content: 'หลังจัดส่งสินค้าจะได้รับ SMS หรืออีเมลพร้อมเลขพัสดุ สามารถติดตามสถานะผ่านเว็บไซต์ของขนส่งที่ใช้จัดส่งได้โดยตรง' },
  { category: 'package-contents', question: 'ในกล่องมีอะไรบ้าง', content: 'ในกล่องประกอบด้วยหูฟัง เคสชาร์จ สายชาร์จ USB-C จุกยางหูฟัง 3 ขนาด (S/M/L) และคู่มือการใช้งาน' },
  { category: 'pairing', question: 'จับคู่บลูทูธกับมือถือยังไง', content: 'เปิดฝาเคสชาร์จ กดปุ่มค้างที่หูฟังประมาณ 3 วินาทีจนไฟกระพริบ จากนั้นเข้าเมนู Bluetooth บนมือถือแล้วเลือกชื่ออุปกรณ์เพื่อจับคู่' },
  { category: 'payment', question: 'ชำระเงินได้ช่องทางไหนบ้าง', content: 'รับชำระผ่านบัตรเครดิต/เดบิต, พร้อมเพย์ และเก็บเงินปลายทาง (COD) สำหรับคำสั่งซื้อในประเทศไทย' },
  { category: 'pricing', question: 'หูฟังราคาเท่าไหร่', content: 'หูฟังไร้สายรุ่นนี้ราคา 1,990 บาท' },
  { category: 'promotions', question: 'มีส่วนลดหรือโค้ดส่วนลดไหม', content: 'ติดตามโปรโมชั่นและโค้ดส่วนลดได้ทางหน้าร้านและช่องทางโซเชียลมีเดียของร้าน ส่วนลดจะเปลี่ยนแปลงตามช่วงเวลา' },
  { category: 'replacement', question: 'หูฟังหายข้างเดียวซื้อแยกได้ไหม', content: 'สามารถซื้อหูฟังข้างเดียวเพื่อทดแทนได้ กรุณาติดต่อทีมงานผ่านหน้าแชทพร้อมแจ้งเลขคำสั่งซื้อเพื่อตรวจสอบสต็อกและราคา' },
  { category: 'reviews', question: 'มีรีวิวจากลูกค้าจริงไหม ดูได้ที่ไหน', content: 'ลูกค้าที่ซื้อสินค้าสามารถให้คะแนนและเขียนรีวิวได้ สามารถอ่านรีวิวจากลูกค้าจริงได้ที่หน้าเพจร้านค้าและช่องทางโซเชียลมีเดียของร้าน' },
  { category: 'support', question: 'ติดต่อเจ้าหน้าที่ได้เวลาไหนบ้าง', content: 'ทีมงานพร้อมให้บริการผ่านหน้าแชททุกวัน เวลา 09:00-21:00 น. นอกเวลาดังกล่าวสามารถฝากข้อความไว้ได้ ทีมงานจะตอบกลับโดยเร็วที่สุด' },
];

async function main() {
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  }
  const { token } = await loginRes.json();

  for (const faq of missingFaqs) {
    const res = await fetch(`${BASE_URL}/api/admin/faqs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(faq),
    });
    if (!res.ok) {
      console.error(`Failed [${faq.category}]: ${res.status} ${await res.text()}`);
      continue;
    }
    console.log(`Added [${faq.category}] ${faq.question}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
