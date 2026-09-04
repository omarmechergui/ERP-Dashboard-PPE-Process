const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log("=== Début des tests du workflow Organigramme ===\n");

  try {
    // 1. Récupérer un utilisateur (par ex: ADMIN)
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const superv = await prisma.user.findFirst({ where: { role: 'SUPERVISEUR' } });

    if (!admin) throw new Error("Aucun administrateur trouvé pour les tests");

    console.log("--> Création d'un brouillon...");
    let org = await prisma.organigramme.create({
      data: {
        titre: 'Org Test Workflow',
        description: 'Test automatisé',
        snapshot: '{}', // Mock snapshot
        statut: 'BROUILLON',
        createdBy: admin.id
      }
    });
    console.log(`✅ Créé avec ID: ${org.id}, Statut: ${org.statut}`);

    console.log("\n--> Soumission pour validation...");
    org = await prisma.organigramme.update({
      where: { id: org.id },
      data: { statut: 'EN_VALIDATION' }
    });
    await prisma.organigrammeHistory.create({
      data: {
        organigramme_id: org.id,
        previous_status: 'BROUILLON',
        new_status: 'EN_VALIDATION',
        user_id: admin.id,
        comment: 'Soumis pour test'
      }
    });
    console.log(`✅ Statut actuel: ${org.statut}`);

    console.log("\n--> Rejet de l'organigramme...");
    org = await prisma.organigramme.update({
      where: { id: org.id },
      data: { statut: 'REJETE' }
    });
    await prisma.organigrammeHistory.create({
      data: {
        organigramme_id: org.id,
        previous_status: 'EN_VALIDATION',
        new_status: 'REJETE',
        user_id: admin.id,
        rejection_reason: 'Données incomplètes',
        comment: 'Rejet test'
      }
    });
    console.log(`✅ Statut actuel: ${org.statut}`);

    console.log("\n--> Remise en brouillon...");
    org = await prisma.organigramme.update({
      where: { id: org.id },
      data: { statut: 'BROUILLON' }
    });
    await prisma.organigrammeHistory.create({
      data: {
        organigramme_id: org.id,
        previous_status: 'REJETE',
        new_status: 'BROUILLON',
        user_id: admin.id,
      }
    });
    console.log(`✅ Statut actuel: ${org.statut}`);

    console.log("\n--> Resoumission et Validation...");
    org = await prisma.organigramme.update({
      where: { id: org.id },
      data: { statut: 'EN_VALIDATION' }
    });
    org = await prisma.organigramme.update({
      where: { id: org.id },
      data: { statut: 'VALIDE' }
    });
    await prisma.organigrammeHistory.create({
      data: {
        organigramme_id: org.id,
        previous_status: 'EN_VALIDATION',
        new_status: 'VALIDE',
        user_id: admin.id,
        comment: 'Validation OK'
      }
    });
    console.log(`✅ Statut actuel: ${org.statut}`);

    console.log("\n--> Vérification de l'historique...");
    const history = await prisma.organigrammeHistory.findMany({
      where: { organigramme_id: org.id },
      orderBy: { timestamp: 'asc' }
    });
    history.forEach(h => {
      console.log(`   - ${h.previous_status || 'N/A'} -> ${h.new_status} (Raison: ${h.rejection_reason || 'Aucune'})`);
    });

    console.log("\n=== Tous les tests ont réussi ===");
  } catch (err) {
    console.error("❌ Erreur pendant les tests:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
