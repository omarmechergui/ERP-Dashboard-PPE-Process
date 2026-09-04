const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const machines = await prisma.machine.findMany();
  console.log('Machine count:', machines.length);
  console.log('Machines:', JSON.stringify(machines, null, 2));
  
  const panneaux = await prisma.panneau.findMany({ select: { id: true, title_panneau: true, title_project: true } });
  console.log('\nPanneau count:', panneaux.length);
  console.log('Panneaux:', JSON.stringify(panneaux, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
