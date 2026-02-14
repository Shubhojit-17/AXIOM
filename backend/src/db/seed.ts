import prisma from './client';

const seedApis = [
  {
    id: 'api-1',
    name: 'AI Summarizer Pro',
    description: 'Advanced NLP model that summarizes long text or PDFs into concise bullet points.',
    category: 'AI/ML',
    tags: JSON.stringify(['NLP', 'Summary', 'Text']),
    endpoint: '/gateway/api-1/execute',
    upstreamUrl: 'https://httpbin.org/post',
    method: 'POST',
    pricePerReq: 0.05,
    provider: 'SP2...X4',
    providerWallet: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9A6D83',
    providerName: 'NeuralLabs',
    status: 'active',
    inputType: 'text',
    inputSchema: JSON.stringify({ source: 'string', options: { format: 'string', detailed: 'boolean' } }),
    uptime: 99.9,
    totalCalls: 0,
    successCalls: 0,
    latency: 240,
  },
  {
    id: 'api-2',
    name: 'PDF Builder',
    description: 'Generate professional PDFs from HTML or JSON data instantly.',
    category: 'File Utilities',
    tags: JSON.stringify(['PDF', 'Generation']),
    endpoint: '/gateway/api-2/execute',
    upstreamUrl: 'https://httpbin.org/post',
    method: 'POST',
    pricePerReq: 0.02,
    provider: 'SP3...A2',
    providerWallet: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
    providerName: 'DocForge',
    status: 'active',
    inputType: 'json',
    inputSchema: JSON.stringify({ html: 'string', title: 'string', format: 'string' }),
    uptime: 99.5,
    totalCalls: 0,
    successCalls: 0,
    latency: 180,
  },
  {
    id: 'api-3',
    name: 'Crypto Price Stream',
    description: 'Real-time cryptocurrency prices from 50+ exchanges via a single socket.',
    category: 'Crypto Data',
    tags: JSON.stringify(['Crypto', 'Finance', 'WebSocket']),
    endpoint: '/gateway/api-3/execute',
    upstreamUrl: 'https://httpbin.org/get',
    method: 'GET',
    pricePerReq: 0.01,
    provider: 'SP1...B9',
    providerWallet: 'SP1K1A1PMQY7Y3ZZ2XGDD2EHESP1VWPTG5HKA22C5',
    providerName: 'CryptoFlow',
    status: 'active',
    inputType: 'json',
    inputSchema: null,
    uptime: 100,
    totalCalls: 0,
    successCalls: 0,
    latency: 45,
  },
  {
    id: 'api-4',
    name: 'Smart OCR Vision',
    description: 'Extract text from images and scanned documents with high accuracy.',
    category: 'AI/ML',
    tags: JSON.stringify(['Vision', 'OCR', 'Image']),
    endpoint: '/gateway/api-4/execute',
    upstreamUrl: 'https://httpbin.org/post',
    method: 'POST',
    pricePerReq: 0.08,
    provider: 'SP4...C7',
    providerWallet: 'SP4ATSG6F0Q2GYNMFKQV3ENNZMEG7BA50JRJ5Z0B1',
    providerName: 'VisionAI',
    status: 'active',
    inputType: 'pdf',
    inputSchema: JSON.stringify({ image_url: 'string', language: 'string' }),
    uptime: 98.9,
    totalCalls: 0,
    successCalls: 0,
    latency: 800,
  },
  {
    id: 'api-5',
    name: 'Web Scraper X',
    description: 'Scrape any website and return structured JSON data. Handles JS rendering.',
    category: 'Web Scraping',
    tags: JSON.stringify(['Scraping', 'Data']),
    endpoint: '/gateway/api-5/execute',
    upstreamUrl: 'https://httpbin.org/get',
    method: 'GET',
    pricePerReq: 0.03,
    provider: 'SP5...D1',
    providerWallet: 'SP5H7GAP0K8V8GQJM9DESR89ZB1AQBG4BBHJ7XYMS',
    providerName: 'ScrapeMaster',
    status: 'active',
    inputType: 'json',
    inputSchema: JSON.stringify({ url: 'string', selector: 'string' }),
    uptime: 99.2,
    totalCalls: 0,
    successCalls: 0,
    latency: 1500,
  },
  {
    id: 'api-6',
    name: 'Sentiment Analysis',
    description: 'Determine the emotional tone of text. Positive, Negative, or Neutral.',
    category: 'AI/ML',
    tags: JSON.stringify(['NLP', 'Sentiment']),
    endpoint: '/gateway/api-6/execute',
    upstreamUrl: 'https://httpbin.org/post',
    method: 'POST',
    pricePerReq: 0.04,
    provider: 'SP2...X4',
    providerWallet: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9A6D83',
    providerName: 'NeuralLabs',
    status: 'active',
    inputType: 'text',
    inputSchema: JSON.stringify({ text: 'string', language: 'string' }),
    uptime: 99.8,
    totalCalls: 0,
    successCalls: 0,
    latency: 210,
  },
];

async function main() {
  console.log('🌱 Seeding AXIOM database...');

  // Clear ALL existing data
  await prisma.usedPaymentProof.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.apiService.deleteMany();

  // Seed ONLY API services — no transactions, no call logs, no proofs
  for (const api of seedApis) {
    await prisma.apiService.create({ data: api });
  }
  console.log(`✅ Seeded ${seedApis.length} API services (0 transactions, 0 calls)`);

  console.log('🎉 Database seeded — clean slate for judges!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
