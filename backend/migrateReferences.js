const { PrismaClient } = require('@prisma/client');
const { nextSeq } = require('./src/helpers/counterHelper');

const prisma = new PrismaClient();

async function main() {
  console.log("Migrating existing planifications...");
  
  // Fetch all planifications using raw MongoDB query to bypass Prisma schema validation for null references
  const result = await prisma.$runCommandRaw({
    find: "Planification",
    filter: {
      $or: [
        { reference: { $exists: false } },
        { reference: null }
      ]
    }
  });

  const planificationsToFix = result.cursor?.firstBatch || [];
  console.log(`Found ${planificationsToFix.length} planifications without a reference.`);

  for (const p of planificationsToFix) {
    const seq = await prisma.counter.upsert({
      where: { id: 'planification' },
      update: { seq: { increment: 1 } },
      create: { id: 'planification', seq: 1 },
    });
    
    const year = new Date().getFullYear();
    const reference = `PLN-${year}-${String(seq.seq).padStart(3, '0')}`;
    
    await prisma.$runCommandRaw({
      update: "Planification",
      updates: [
        {
          q: { _id: p._id },
          u: { $set: { reference: reference } }
        }
      ]
    });
    console.log(`Updated Planification ${p._id.$oid} with reference ${reference}`);
  }
  
  console.log("Migration complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
