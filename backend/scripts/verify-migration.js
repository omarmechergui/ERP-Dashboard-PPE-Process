const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const prisma = new PrismaClient();
const dbPath = path.join(__dirname, '../prisma/dev.db.backup-pre-mongo-20260830');
const db = new sqlite3.Database(dbPath);

const getTable = (tableName) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

async function countTable(tableName) {
  const rows = await getTable(tableName);
  return rows.length;
}

async function main() {
  console.log('Starting verification...');

  try {
    const tables = [
      'User', 'UserAuditLog', 'Fournisseur', 'Article', 'BOM', 'BomLigne',
      'Entrepot', 'Planification', 'Panneau', 'MouvementStock', 'KhmControl',
      'Reservation', 'ReservationLigne', 'Commande', 'CommandeLigne',
      'PanneauTimeline', 'PanneauOperator', 'PanneauChecklist', 'PanneauDefect',
      'PanneauScrap', 'PanneauHistory', 'PlanificationHistory', 'Machine',
      'Intervention', 'InterventionPart', 'Skill', 'FormationCatalog',
      'Formation', 'FormationHistory', 'StockLocation', 'ImportHistory',
      'Organigramme', 'OrganigrammeHistory', 'FormationTest', 'FormationTestItem',
      'Badge', 'Certification', 'FormationChecklistTemplate', 'FormationChecklistItem',
      'PreventiveMaintenance', 'PreventiveChecklistItem'
    ];

    let allMatch = true;

    for (const table of tables) {
      const sqliteCount = await countTable(table);
      const mongoCountStr = table.charAt(0).toLowerCase() + table.slice(1);
      const mongoCount = await prisma[mongoCountStr].count();
      
      if (sqliteCount !== mongoCount) {
        console.error(`Mismatch in ${table}: SQLite=${sqliteCount}, MongoDB=${mongoCount}`);
        allMatch = false;
      } else {
        console.log(`${table}: ${sqliteCount} records match.`);
      }
    }

    if (allMatch) {
      console.log('All table counts match successfully!');
    }
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await prisma.$disconnect();
    db.close();
  }
}

main();
