import prisma from './client';

async function main() {
  console.log('🌱 Seeding AXIOM database...');

  // Find all demo/seed services that point to httpbin.org
  const demoServices = await prisma.apiService.findMany({
    where: { upstreamUrl: { contains: 'httpbin.org' } },
    select: { id: true, name: true },
  });

  const demoIds = demoServices.map((s) => s.id);

  if (demoIds.length === 0) {
    console.log('✅ No demo services found — database is already clean.');
    return;
  }

  console.log(`Found ${demoIds.length} demo services to remove:`, demoServices.map((s) => s.name));

  // Delete related records first (foreign key constraints)
  await prisma.callLog.deleteMany({ where: { apiId: { in: demoIds } } });
  await prisma.transaction.deleteMany({ where: { apiId: { in: demoIds } } });
  await prisma.usedPaymentProof.deleteMany({ where: { apiId: { in: demoIds } } });

  // Now delete the demo services
  const deleted = await prisma.apiService.deleteMany({
    where: { id: { in: demoIds } },
  });

  console.log(`🗑️  Removed ${deleted.count} demo placeholder services`);
  console.log('✅ Database is clean — only real registered services remain.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
