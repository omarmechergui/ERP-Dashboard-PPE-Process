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
  await prisma.khmControl.deleteMany({});
  await prisma.panneauTimeline.deleteMany({});
  await prisma.panneauOperator.deleteMany({});
  await prisma.panneauChecklist.deleteMany({});
  await prisma.panneauDefect.deleteMany({});
  await prisma.panneauScrap.deleteMany({});
  await prisma.panneauHistory.deleteMany({});
  await prisma.mouvementStock.deleteMany({});
  await prisma.panneau.deleteMany({});
  await prisma.planification.deleteMany({});
  await prisma.bomLigne.deleteMany({});
  await prisma.reservationLigne.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.commandeLigne.deleteMany({});
  await prisma.commande.deleteMany({});
  await prisma.stockLocation.deleteMany({});
  await prisma.interventionPart.deleteMany({});
  await prisma.article.deleteMany({});
  await prisma.fournisseur.deleteMany({});
  await prisma.bOM.deleteMany({});
  await prisma.entrepot.deleteMany({});
  await prisma.user.deleteMany({});
}

module.exports = {
  prisma,
  cleanDb,
};
