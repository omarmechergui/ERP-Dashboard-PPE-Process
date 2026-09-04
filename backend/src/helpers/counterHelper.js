const prisma = require('../config/db');

async function nextSeq(tx, name) {
  const counter = await tx.counter.upsert({
    where: { id: name },
    update: { seq: { increment: 1 } },
    create: { id: name, seq: 1 },
  });
  return counter.seq;
}

module.exports = { nextSeq };
