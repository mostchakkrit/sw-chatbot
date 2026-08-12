import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { pipeline, FeatureExtractionPipeline } from '@huggingface/transformers';

const prisma = new PrismaClient();
const MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

const faqs: { question: string; content: string; category: string }[] = [
  {
    category: 'shipping',
    question: 'จัดส่งสินค้ากี่วัน',
    content: 'จัดส่งสินค้าภายใน 1-3 วันทำการทั่วประเทศไทย ผ่านขนส่ง Kerry และ Flash Express ค่าส่งฟรีเมื่อสั่งซื้อครบ 500 บาท',
  },
  {
    category: 'warranty',
    question: 'รับประกัน',
    content: 'หูฟังไร้สายรุ่นนี้รับประกันสินค้า 1 ปีเต็ม ครอบคลุมความเสียหายจากการผลิต ไม่ครอบคลุมกรณีตกน้ำหรือแตกหักจากอุบัติเหตุ',
  },
  {
    category: 'battery',
    question: 'แบตเตอรี่ใช้งานได้นานแค่ไหน',
    content: 'แบตเตอรี่หูฟังใช้งานต่อเนื่องได้สูงสุด 8 ชั่วโมง และเมื่อรวมกับเคสชาร์จจะได้นานสูงสุด 32 ชั่วโมง ชาร์จเต็มใช้เวลาประมาณ 1.5 ชั่วโมง',
  },
  {
    category: 'connectivity',
    question: 'หูฟังเชื่อมต่อบลูทูธเวอร์ชันอะไร',
    content: 'หูฟังรองรับ Bluetooth 5.3 เชื่อมต่อได้กับมือถือ แท็บเล็ต และคอมพิวเตอร์ รองรับการเชื่อมต่อพร้อมกันสูงสุด 2 อุปกรณ์ (multipoint)',
  },
  {
    category: 'returns',
    question: 'เปลี่ยนหรือคืนสินค้าได้ไหม',
    content: 'สามารถเปลี่ยนหรือคืนสินค้าได้ภายใน 7 วันหลังได้รับสินค้า หากสินค้ายังไม่แกะซีลหรือมีตำหนิจากการผลิต โดยติดต่อทีมงานผ่านหน้าแชท',
  },
  {
    category: 'features',
    question: 'หูฟังมีระบบตัดเสียงรบกวนไหม',
    content: 'หูฟังมีระบบตัดเสียงรบกวนแบบ Active Noise Cancellation (ANC) และโหมด Ambient Sound สำหรับฟังเสียงรอบข้างขณะสวมใส่',
  },
  {
    category: 'waterproof',
    question: 'หูฟังกันน้ำไหม',
    content: 'หูฟังมีมาตรฐานกันน้ำกันเหงื่อระดับ IPX4 เหมาะสำหรับการออกกำลังกาย แต่ไม่สามารถแช่น้ำหรือใส่ว่ายน้ำได้',
  },
  {
    category: 'manufacturing',
    question: 'สินค้าผลิตวันที่เท่าไหร่',
    content: 'สินค้าผลิตวันที่ 1/1/2569',
  },
  {
    category: 'fit',
    question: 'จุกหูฟังมีกี่ขนาด เปลี่ยนได้ไหม',
    content: 'มีจุกยางให้เลือก 3 ขนาด (S/M/L) แถมมาในกล่อง สามารถถอดเปลี่ยนเองได้เพื่อความกระชับและกันเสียงรั่วที่ดีขึ้น',
  },
  {
    category: 'order-tracking',
    question: 'เช็คสถานะพัสดุยังไง',
    content: 'หลังจัดส่งสินค้าจะได้รับ SMS หรืออีเมลพร้อมเลขพัสดุ สามารถติดตามสถานะผ่านเว็บไซต์ของขนส่งที่ใช้จัดส่งได้โดยตรง',
  },
  {
    category: 'package-contents',
    question: 'ในกล่องมีอะไรบ้าง',
    content: 'ในกล่องประกอบด้วยหูฟัง เคสชาร์จ สายชาร์จ USB-C จุกยางหูฟัง 3 ขนาด (S/M/L) และคู่มือการใช้งาน',
  },
  {
    category: 'pairing',
    question: 'จับคู่บลูทูธกับมือถือยังไง',
    content: 'เปิดฝาเคสชาร์จ กดปุ่มค้างที่หูฟังประมาณ 3 วินาทีจนไฟกระพริบ จากนั้นเข้าเมนู Bluetooth บนมือถือแล้วเลือกชื่ออุปกรณ์เพื่อจับคู่',
  },
  {
    category: 'payment',
    question: 'ชำระเงินได้ช่องทางไหนบ้าง',
    content: 'รับชำระผ่านบัตรเครดิต/เดบิต, พร้อมเพย์ และเก็บเงินปลายทาง (COD) สำหรับคำสั่งซื้อในประเทศไทย',
  },
  {
    category: 'pricing',
    question: 'หูฟังราคาเท่าไหร่',
    content: 'หูฟังไร้สายรุ่นนี้ราคา 1,990 บาท',
  },
  {
    category: 'promotions',
    question: 'มีส่วนลดหรือโค้ดส่วนลดไหม',
    content: 'ติดตามโปรโมชั่นและโค้ดส่วนลดได้ทางหน้าร้านและช่องทางโซเชียลมีเดียของร้าน ส่วนลดจะเปลี่ยนแปลงตามช่วงเวลา',
  },
  {
    category: 'replacement',
    question: 'หูฟังหายข้างเดียวซื้อแยกได้ไหม',
    content: 'สามารถซื้อหูฟังข้างเดียวเพื่อทดแทนได้ กรุณาติดต่อทีมงานผ่านหน้าแชทพร้อมแจ้งเลขคำสั่งซื้อเพื่อตรวจสอบสต็อกและราคา',
  },
  {
    category: 'reviews',
    question: 'มีรีวิวจากลูกค้าจริงไหม ดูได้ที่ไหน',
    content: 'ลูกค้าที่ซื้อสินค้าสามารถให้คะแนนและเขียนรีวิวได้ สามารถอ่านรีวิวจากลูกค้าจริงได้ที่หน้าเพจร้านค้าและช่องทางโซเชียลมีเดียของร้าน',
  },
  {
    category: 'support',
    question: 'ติดต่อเจ้าหน้าที่ได้เวลาไหนบ้าง',
    content: 'ทีมงานพร้อมให้บริการผ่านหน้าแชททุกวัน เวลา 09:00-21:00 น. นอกเวลาดังกล่าวสามารถฝากข้อความไว้ได้ ทีมงานจะตอบกลับโดยเร็วที่สุด',
  },
];

async function main() {
  const extractor = (await pipeline('feature-extraction', MODEL_ID)) as FeatureExtractionPipeline;

  for (const faq of faqs) {
    const output = await extractor(faq.question, { pooling: 'mean', normalize: true });
    const vector = Array.from(output.data as Float32Array);
    const vectorLiteral = `[${vector.join(',')}]`;

    await prisma.$executeRaw`
      INSERT INTO knowledge_base (id, question, content, embedding, category, updated_at)
      VALUES (${randomUUID()}, ${faq.question}, ${faq.content}, ${vectorLiteral}::vector, ${faq.category}, now())
    `;
    console.log(`seeded: [${faq.category}] ${faq.question}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
