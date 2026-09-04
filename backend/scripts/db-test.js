const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("SUCCESS: Connected to MongoDB!");
    const count = await prisma.user.count();
    console.log(`SUCCESS: Found ${count} users in the database.`);
  } catch (error) {
    console.error("ERROR: Failed to connect to MongoDB.");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
