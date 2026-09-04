const crypto = require('crypto');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  let user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!user) user = await prisma.user.findFirst();
  
  const token = jwt.sign(
    { id: user.id, matricule: user.matricule, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  
  const rows = [];
  const TOTAL = 200; // Let's test 200 rows -> 2 batches
  for (let i = 1; i <= TOTAL; i++) {
    rows.push({ 'Article Code': 'NEW_BATCH_' + i, 'Quantity': 5, 'Location': 'LOC_BATCH' });
  }
  
  const fileHash = crypto.createHash('md5').update('batch_test_' + Date.now()).digest('hex');
  const fileName = 'batch_test.xlsx';

  console.log(`Starting frontend simulation for ${TOTAL} rows...`);
  
  const BATCH_SIZE = 25;
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
  
  let currentImported = 0;
  
  const startTime = Date.now();

  for (let i = 0; i < totalBatches; i++) {
    const batchRows = rows.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    
    const payload = {
      rows: batchRows,
      matricule: 'BATCH_SCRIPT',
      fileHash: i === 0 ? fileHash : undefined,
      fileName: i === 0 ? fileName : undefined
    };
    
    const res = await fetch('http://localhost:5000/stock/import/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (!res.ok) {
        console.error(`Batch ${i+1} failed:`, data);
        break;
    }
    
    currentImported += data.imported;
    console.log(`Batch ${i+1}/${totalBatches} completed. Imported: ${data.imported}. Time so far: ${(Date.now() - startTime)/1000}s`);
  }
  
  console.log(`Finished. Total imported: ${currentImported} in ${(Date.now() - startTime)/1000}s`);
  await prisma.$disconnect();
}

test().catch(console.error);
