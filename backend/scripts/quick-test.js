const crypto = require('crypto');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  let user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!user) user = await prisma.user.findFirst();
  console.log('User:', user?.id, user?.role, user?.matricule);
  
  const token = jwt.sign(
    { id: user.id, matricule: user.matricule, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  
  const rows = [];
  for (let i = 1; i <= 5; i++) {
    rows.push({ 'Article Code': 'BENCH_' + i, 'Quantity': 10, 'Location': 'LOC_1' });
  }
  
  const payload = {
    rows,
    matricule: 'BENCHMARK',
    fileHash: crypto.createHash('md5').update('quick_test_' + Date.now()).digest('hex'),
    fileName: 'test.xlsx',
    isPreview: false
  };
  
  const res = await fetch('http://localhost:5000/stock/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify(payload)
  });
  
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
  await prisma.$disconnect();
}

test().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
