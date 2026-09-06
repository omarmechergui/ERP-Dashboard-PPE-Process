const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('etat_construction:', await prisma.panneau.groupBy({ by: ['etat_construction'], _count: { etat_construction: true } }));
  console.log('status:', await prisma.panneau.groupBy({ by: ['status'], _count: { status: true } }));
  console.log('etat_validation:', await prisma.panneau.groupBy({ by: ['etat_validation'], _count: { etat_validation: true } }));
  console.log('etat_khm:', await prisma.panneau.groupBy({ by: ['etat_khm'], _count: { etat_khm: true } }));
}
main().finally(() => prisma.$disconnect());
