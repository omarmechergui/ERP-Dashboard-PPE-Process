const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '../src'));
files.push(path.join(__dirname, '../tests/setup.js'));

const replacements = [
  { from: /parseInt\(id\)/g, to: 'id' },
  { from: /parseInt\(req\.params\.id\)/g, to: 'req.params.id' },
  { from: /parseInt\(technicienId\)/g, to: 'technicienId' },
  { from: /parseInt\(machineId\)/g, to: 'machineId' },
  { from: /parseInt\(organigrammeId\)/g, to: 'organigrammeId' },
  { from: /parseInt\(fournisseur_id\)/g, to: 'fournisseur_id' },
  { from: /parseInt\(bom_id(?:,\s*10)?\)/g, to: 'bom_id' },
  { from: /parseInt\(entrepot_id(?:,\s*10)?\)/g, to: 'entrepot_id' },
  { from: /Number\(id\)/g, to: 'id' },
  { from: /parseInt\(item\.id\)/g, to: 'item.id' },
  { from: /parseInt\(userId\)/g, to: 'userId' },
  { from: /parseInt\(actorId\)/g, to: 'actorId' },
  { from: /parseInt\(superviseur_id\)/g, to: 'superviseur_id' },
  { from: /parseInt\(planification_id\)/g, to: 'planification_id' },
  { from: /parseInt\(reservation_id\)/g, to: 'reservation_id' },
  { from: /parseInt\(commande_id\)/g, to: 'commande_id' },
  { from: /parseInt\(user_id\)/g, to: 'user_id' },
  { from: /parseInt\(mouvement_stock_id\)/g, to: 'mouvement_stock_id' },
  { from: /parseInt\(preventivePlanId\)/g, to: 'preventivePlanId' },
  { from: /parseInt\(interventionId\)/g, to: 'interventionId' },
  { from: /parseInt\(formationId\)/g, to: 'formationId' },
  { from: /parseInt\(testId\)/g, to: 'testId' },
  { from: /parseInt\(certificationId\)/g, to: 'certificationId' },
  { from: /parseInt\(templateId\)/g, to: 'templateId' },
  { from: /parseInt\(preventiveMaintenanceId\)/g, to: 'preventiveMaintenanceId' },
  { from: /parseInt\(formation_id\)/g, to: 'formation_id' },
  { from: /parseInt\(managerId\)/g, to: 'managerId' },
  { from: /parseInt\(reported_by\)/g, to: 'reported_by' },
  { from: /parseInt\(req\.body\.id\)/g, to: 'req.body.id' },
  { from: /parseInt\(req\.body\.technicienId\)/g, to: 'req.body.technicienId' },
  { from: /parseInt\(req\.body\.machineId\)/g, to: 'req.body.machineId' }
];

let totalReplaced = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplaced++;
  }
});

console.log(`Replaced parseInt/Number in ${totalReplaced} files`);
