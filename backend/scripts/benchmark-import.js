const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:5000/stock/import';

async function getToken() {
  let user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!user) {
    user = await prisma.user.findFirst();
  }
  return jwt.sign(
    { id: user.id, matricule: user.matricule, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
    { expiresIn: '30d' }
  );
}

async function generateDataset(size) {
  const rows = [];
  for (let i = 1; i <= size; i++) {
    rows.push({
      "Article Code": `TEST_ART_${size}_${i}`,
      "Quantity": Math.floor(Math.random() * 100) + 1,
      "Location": `LOC_${i % 10}`,
      "Fournisseur ID": null
    });
  }
  return rows;
}

async function runBenchmark(size, token) {
  console.log(`\n======================================`);
  console.log(`🚀 Benchmarking ${size} records...`);
  const rows = await generateDataset(size);
  const fileHash = crypto.createHash('md5').update(`bench_${size}_${Date.now()}`).digest('hex');
  
  const payload = {
    rows,
    matricule: 'BENCHMARK',
    fileHash,
    fileName: `benchmark_${size}.xlsx`,
    isPreview: false
  };

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 mins

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    const duration = (Date.now() - startTime) / 1000;
    
    if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
    }
    
    console.log(`✅ Success in ${duration.toFixed(2)}s`);
    console.log(`   - Created: ${data.createdCount}`);
    console.log(`   - Updated: ${data.updatedCount}`);
    console.log(`   - Failed: ${data.failedCount}`);
    console.log(`   - Batches: ${data.successBatchCount}/${data.totalBatches} successful`);
    
    if (data.failedCount > 0) {
      if (data.batchResults && data.batchResults.some(b => b.status === "FAILED")) {
        console.error("   - First Batch Error:", data.batchResults.find(b => b.status === "FAILED").error);
      }
      if (data.failedRows && data.failedRows.length > 0) {
        console.error("   - First Row Error:", data.failedRows[0]);
      }
    }
    
    return { size, duration, success: true, ...data };
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.log(`❌ Failed in ${duration.toFixed(2)}s`);
    console.error(`   Error: ${error.message}`);
    return { size, duration, success: false, error: error.message };
  }
}

async function main() {
  const sizes = [10, 100, 500, 1000, 5000];
  const results = [];
  
  console.log("⚠️ Ensure the backend server is running on port 5000");
  const token = await getToken();
  
  for (const size of sizes) {
    const result = await runBenchmark(size, token);
    results.push(result);
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n======================================`);
  console.log(`📊 FINAL RESULTS`);
  console.table(results.map(r => ({
    Size: r.size,
    DurationSec: r.duration.toFixed(2),
    Success: r.success,
    Created: r.createdCount || 0,
    SpeedRecSec: (r.size / r.duration).toFixed(2)
  })));
  
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
