const { execSync } = require('child_process');
const path = require('path');

// Force test environment variables before requiring db or app
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || 'mongodb+srv://omar:IgjTwxx7yyvwSSSc@cluster0.rdjpu.mongodb.net/DashboardPPEProcessTest?retryWrites=true&w=majority';
process.env.JWT_SECRET = 'super_secret_test_jwt_key_that_is_long_enough_for_sure_123456';
process.env.NODE_ENV = 'test';

const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

try {
  execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss --skip-generate`, {
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL_TEST || 'mongodb+srv://omar:IgjTwxx7yyvwSSSc@cluster0.rdjpu.mongodb.net/DashboardPPEProcessTest?retryWrites=true&w=majority'
    },
    stdio: 'ignore'
  });
} catch (error) {
  console.error("Failed to push prisma schema to test database:", error);
  // Do not exit aggressively if tests are to be run offline/mocked
}

const prisma = require('../src/config/db');

async function cleanDb() {
  // Disconnect any active connections to be safe? No.
  
  // We should try to clear all collections safely.
  // In MongoDB, you can use deleteMany without transaction.
  // The order is important due to Prisma's application-level relation checks.
  
  // 1. Delete deeply nested histories and logs first
  await prisma.userAuditLog.deleteMany({});
  await prisma.panneauHistory.deleteMany({});
  await prisma.planificationHistory.deleteMany({});
  await prisma.formationHistory.deleteMany({});
  await prisma.organigrammeHistory.deleteMany({});
  
  // 2. Delete test/checklist and sub-items
  await prisma.formationTestItem.deleteMany({});
  await prisma.formationTest.deleteMany({});
  await prisma.formationChecklistItem.deleteMany({});
  await prisma.formationChecklistTemplate.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.certification.deleteMany({});
  await prisma.formation.deleteMany({});
  
  // 3. Delete preventive & interventions
  await prisma.interventionPart.deleteMany({});
  await prisma.intervention.deleteMany({});
  await prisma.preventiveChecklistItem.deleteMany({});
  await prisma.preventiveMaintenance.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.machine.deleteMany({});
  
  // 4. Delete Panneau related
  await prisma.khmControl.deleteMany({});
  await prisma.panneauTimeline.deleteMany({});
  await prisma.panneauOperator.deleteMany({});
  await prisma.panneauChecklist.deleteMany({});
  await prisma.panneauDefect.deleteMany({});
  await prisma.panneauScrap.deleteMany({});
  await prisma.panneau.deleteMany({});
  
  // 5. Delete Stock related
  await prisma.mouvementStock.deleteMany({});
  await prisma.stockLocation.deleteMany({});
  await prisma.bomLigne.deleteMany({});
  await prisma.bOM.deleteMany({});
  await prisma.reservationLigne.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.commandeLigne.deleteMany({});
  await prisma.commande.deleteMany({});
  
  // 5.5 Planification
  await prisma.planification.deleteMany({});
  
  // 6. Delete core tables
  await prisma.article.deleteMany({});
  await prisma.fournisseur.deleteMany({});
  await prisma.entrepot.deleteMany({});
  
  // 7. Organigramme
  await prisma.organigramme.deleteMany({});
  
  // 8. Users
  await prisma.user.deleteMany({});
}

module.exports = {
  prisma,
  cleanDb,
};
