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
    question: 'รับประกันสินค้ากี่ปี',
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
    content: 'สินค้าล็อตปัจจุบันผลิตวันที่ 1/1/2569',
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
