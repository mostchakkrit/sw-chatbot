import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { pipeline, FeatureExtractionPipeline } from '@huggingface/transformers';

const prisma = new PrismaClient();
const MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

const faqs: { content: string; category: string }[] = [
  {
    category: 'shipping',
    content: 'จัดส่งสินค้าภายใน 1-3 วันทำการทั่วประเทศไทย ผ่านขนส่ง Kerry และ Flash Express ค่าส่งฟรีเมื่อสั่งซื้อครบ 500 บาท',
  },
  {
    category: 'warranty',
    content: 'หูฟังไร้สายรุ่นนี้รับประกันสินค้า 1 ปีเต็ม ครอบคลุมความเสียหายจากการผลิต ไม่ครอบคลุมกรณีตกน้ำหรือแตกหักจากอุบัติเหตุ',
  },
  {
    category: 'battery',
    content: 'แบตเตอรี่หูฟังใช้งานต่อเนื่องได้สูงสุด 8 ชั่วโมง และเมื่อรวมกับเคสชาร์จจะได้นานสูงสุด 32 ชั่วโมง ชาร์จเต็มใช้เวลาประมาณ 1.5 ชั่วโมง',
  },
  {
    category: 'connectivity',
    content: 'หูฟังรองรับ Bluetooth 5.3 เชื่อมต่อได้กับมือถือ แท็บเล็ต และคอมพิวเตอร์ รองรับการเชื่อมต่อพร้อมกันสูงสุด 2 อุปกรณ์ (multipoint)',
  },
  {
    category: 'returns',
    content: 'สามารถเปลี่ยนหรือคืนสินค้าได้ภายใน 7 วันหลังได้รับสินค้า หากสินค้ายังไม่แกะซีลหรือมีตำหนิจากการผลิต โดยติดต่อทีมงานผ่านหน้าแชท',
  },
  {
    category: 'features',
    content: 'หูฟังมีระบบตัดเสียงรบกวนแบบ Active Noise Cancellation (ANC) และโหมด Ambient Sound สำหรับฟังเสียงรอบข้างขณะสวมใส่',
  },
  {
    category: 'waterproof',
    content: 'หูฟังมีมาตรฐานกันน้ำกันเหงื่อระดับ IPX4 เหมาะสำหรับการออกกำลังกาย แต่ไม่สามารถแช่น้ำหรือใส่ว่ายน้ำได้',
  },
];

async function main() {
  const extractor = (await pipeline('feature-extraction', MODEL_ID)) as FeatureExtractionPipeline;

  for (const faq of faqs) {
    const output = await extractor(faq.content, { pooling: 'mean', normalize: true });
    const vector = Array.from(output.data as Float32Array);
    const vectorLiteral = `[${vector.join(',')}]`;

    await prisma.$executeRaw`
      INSERT INTO knowledge_base (id, content, embedding, category, updated_at)
      VALUES (${randomUUID()}, ${faq.content}, ${vectorLiteral}::vector, ${faq.category}, now())
    `;
    console.log(`seeded: [${faq.category}] ${faq.content.slice(0, 40)}...`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
