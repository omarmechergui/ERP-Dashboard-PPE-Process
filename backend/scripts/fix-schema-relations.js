const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// First remove any existing onDelete / onUpdate
schema = schema.replace(/,\s*onDelete:\s*[a-zA-Z]+/g, '');
schema = schema.replace(/,\s*onUpdate:\s*[a-zA-Z]+/g, '');

// Then add onDelete: NoAction, onUpdate: NoAction to all relations that have fields: [...]
schema = schema.replace(/(@relation\([^)]*fields:\s*\[[^\]]+\][^)]*)\)/g, '$1, onDelete: NoAction, onUpdate: NoAction)');

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Fixed relations in schema');
