const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const statuses = await prisma.planification.groupBy({
    by: ['status'],
    _count: { status: true }
  });
  console.log(statuses);
  
  const panneauxStatuses = await prisma.panneau.groupBy({
    by: ['etat_construction'],
    _count: { etat_construction: true }
  });
  console.log("Panneaux etats:", panneauxStatuses);
}
main().catch(console.error).finally(() => prisma.$disconnect());
