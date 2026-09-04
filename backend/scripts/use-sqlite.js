const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../.env.example');

console.log('Converting project to SQLite...');

try {
  if (!fs.existsSync(schemaPath)) {
    console.error('schema.prisma not found!');
    process.exit(1);
  }

  let schema = fs.readFileSync(schemaPath, 'utf8');

  // Replace provider
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');

  // SQLite doesn't support enums, replace them with String and strip out the enum declarations
  // Find and remove enums
  schema = schema.replace(/enum\s+\w+\s+\{[\s\S]*?\}/g, '');

  // Replace enum types in models with String
  const enumTypes = ['Role', 'StatutCompte', 'EtatConstruction', 'EtatValidation', 'EtatKhm', 'TypeMouvement'];
  enumTypes.forEach(type => {
    const regex = new RegExp(`\\b${type}\\b`, 'g');
    schema = schema.replace(regex, 'String');
  });

  // Quote default values for SQLite
  schema = schema.replace(/@default\(ACTIF\)/g, '@default("ACTIF")');
  schema = schema.replace(/@default\(EN_CONSTRUCTION\)/g, '@default("EN_CONSTRUCTION")');
  schema = schema.replace(/@default\(EN_ATTENTE\)/g, '@default("EN_ATTENTE")');

  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log('schema.prisma converted to SQLite successfully.');

  // Create or update .env
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  }

  // Update DATABASE_URL to SQLite
  if (envContent.includes('DATABASE_URL')) {
    envContent = envContent.replace(/DATABASE_URL\s*=\s*".*"/g, 'DATABASE_URL="file:./dev.db"');
  } else {
    envContent += '\nDATABASE_URL="file:./dev.db"';
  }

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('.env updated with SQLite database path.');
  console.log('Conversion complete. You can now run "npx prisma db push" or migrations.');

} catch (err) {
  console.error('Error converting to SQLite:', err);
}
