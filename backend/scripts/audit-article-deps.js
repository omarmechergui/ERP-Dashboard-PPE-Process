/**
 * Audit script: inspect all dependencies for a given Article ID.
 * Usage: node scripts/audit-article-deps.js A00054549
 * 
 * This script is READ-ONLY — it does NOT modify any data.
 */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function auditArticleDeps(articleId) {
  console.log(`\n=== Auditing dependencies for Article: ${articleId} ===\n`);

  // Verify article exists
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) {
    console.log(`Article ${articleId} does NOT exist in the database.`);
    await prisma.$disconnect();
    return;
  }
  console.log(`Article found: ${article.nom_article} (qty: ${article.quantite}, prix: ${article.prix})`);
  console.log('');

  // Check all 7 relations
  const [
    mouvements,
    bomLines,
    reservationLignes,
    commandeLignes,
    scraps,
    stockLocations,
    interventionParts
  ] = await Promise.all([
    prisma.mouvementStock.count({ where: { article_id: articleId } }),
    prisma.bomLigne.count({ where: { article_id: articleId } }),
    prisma.reservationLigne.count({ where: { article_id: articleId } }),
    prisma.commandeLigne.count({ where: { article_id: articleId } }),
    prisma.panneauScrap.count({ where: { article_id: articleId } }),
    prisma.stockLocation.count({ where: { articleId: articleId } }),
    prisma.interventionPart.count({ where: { articleId: articleId } }),
  ]);

  const deps = {
    mouvementsStock: mouvements,
    bomLines: bomLines,
    reservationLignes: reservationLignes,
    commandeLignes: commandeLignes,
    panneauScraps: scraps,
    stockLocations: stockLocations,
    interventionParts: interventionParts,
  };

  console.log('Dependencies:');
  let hasBlocker = false;
  for (const [name, count] of Object.entries(deps)) {
    const marker = count > 0 ? '*** BLOCKING ***' : '';
    console.log(`  - ${name}: ${count} records  ${marker}`);
    if (count > 0) hasBlocker = true;
  }

  console.log('');
  if (hasBlocker) {
    const blockers = Object.entries(deps).filter(([, c]) => c > 0).map(([n]) => n);
    console.log(`Blocking relation(s): ${blockers.join(', ')}`);
  } else {
    console.log('No blocking relations — this article CAN be deleted.');
  }

  console.log('\n=== Audit complete ===\n');
  await prisma.$disconnect();
}

const articleId = process.argv[2];
if (!articleId) {
  console.error('Usage: node scripts/audit-article-deps.js <ARTICLE_ID>');
  process.exit(1);
}

auditArticleDeps(articleId).catch(e => {
  console.error('Audit failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
