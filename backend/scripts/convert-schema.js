const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Update datasource
schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "mongodb"');

// 2. Add Counter model
if (!schema.includes('model Counter')) {
  schema = schema + `\nmodel Counter {\n  id  String @id @map("_id")\n  seq Int    @default(0)\n}\n`;
}

// 3. Replace regular @id fields (except Article and Panneau which are already String @id)
schema = schema.replace(/id\s+Int\s+@id\s+@default\(autoincrement\(\)\)/g, 'id String @id @default(auto()) @map("_id") @db.ObjectId');

// 4. Replace specific relation scalar fields from Int/Int? to String/String? @db.ObjectId
const fieldsToReplace = [
  'managerId', 'userId', 'actorId', 'fournisseur_id', 'bom_id', 'entrepot_id',
  'superviseur_id', 'planification_id', 'reservation_id', 'commande_id', 'user_id',
  'done_by', 'reported_by', 'mouvement_stock_id', 'machineId', 'technicienId',
  'preventivePlanId', 'interventionId', 'submittedBy', 'validatedBy', 'rejectedBy',
  'createdBy', 'organigramme_id', 'superviseurId', 'formationId', 'formationTestId',
  'testId', 'certificationId', 'templateId', 'preventiveMaintenanceId', 'formation_id'
];

fieldsToReplace.forEach(field => {
  // Replace Int?
  const regexOpt = new RegExp(`${field}\\s+Int\\?`, 'g');
  schema = schema.replace(regexOpt, `${field} String? @db.ObjectId`);
  // Replace Int
  const regexReq = new RegExp(`\\b${field}\\s+Int\\b`, 'g');
  schema = schema.replace(regexReq, `${field} String @db.ObjectId`);
});

// 5. Fix Planification relations
schema = schema.replace(
  /matricule_gl\s+String\s*\ngl\s+User\s+@relation\("GLPlanifications",\s*fields:\s*\[matricule_gl\],\s*references:\s*\[matricule\]\)\s*\n\s*matricule_superviseur\s+String\s*\n\s*superviseur\s+User\s+@relation\("SuperviseurPlanifications",\s*fields:\s*\[matricule_superviseur\],\s*references:\s*\[matricule\]\)/,
  `matricule_gl          String
  matricule_superviseur String
  glId                  String   @db.ObjectId
  gl                    User     @relation("GLPlanifications", fields: [glId], references: [id])
  superviseurId         String   @db.ObjectId
  superviseur           User     @relation("SuperviseurPlanifications", fields: [superviseurId], references: [id])`
);

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Schema successfully converted to MongoDB format.');
