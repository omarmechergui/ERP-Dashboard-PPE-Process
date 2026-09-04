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

async function main() {
  console.log('Starting migration...');

  try {
    const users = await getTable('User');
    console.log(`Migrating ${users.length} Users...`);
    // Example: Create mappings for old integer IDs to new ObjectIds. 
    // In MongoDB we can just generate new ObjectIds, but we need to map relations.
    // For simplicity, we can let Prisma generate ObjectIds and we keep a map of oldIntId -> newStringId.
    const userMap = new Map();
    
    for (const u of users) {
      const created = await prisma.user.create({
        data: {
          matricule: u.matricule,
          email: u.email,
          nom: u.nom,
          mot_de_passe: u.mot_de_passe,
          role: u.role,
          statut: u.statut,
          photoUrl: u.photoUrl,
          phoneNumber: u.phoneNumber,
          hireDate: u.hireDate ? new Date(u.hireDate) : null,
          department: u.department,
          position: u.position,
          currentNiveau: u.currentNiveau,
          nextTestDate: u.nextTestDate ? new Date(u.nextTestDate) : null,
          createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
          updatedAt: u.updatedAt ? new Date(u.updatedAt) : undefined,
        }
      });
      userMap.set(u.id, created.id);
    }
    
    // Update manager relations
    for (const u of users) {
      if (u.managerId) {
        await prisma.user.update({
          where: { matricule: u.matricule },
          data: { managerId: userMap.get(u.managerId) }
        });
      }
    }

    console.log('Migration completed successfully (partial template).');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
    db.close();
  }
}

main();
