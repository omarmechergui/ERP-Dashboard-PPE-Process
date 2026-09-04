const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Formation Checklist Templates...");

  const templates = [
    {
      niveau: 'Niveau 1',
      title: 'Checklist de Certification - Niveau 1 (Débutant vers N1)',
      description: 'Évaluation des compétences de base en sécurité et procédures standard.',
      items: [
        { category: 'Sécurité', question: 'Port des EPI (Équipements de Protection Individuelle) obligatoire', order: 1, points: 1 },
        { category: 'Sécurité', question: 'Connaissance des issues de secours et points de rassemblement', order: 2, points: 1 },
        { category: 'Procédure', question: 'Maitrise du processus d\'allumage et d\'extinction machine', order: 3, points: 1 },
        { category: 'Procédure', question: 'Respect des fiches d\'instruction au poste', order: 4, points: 1 },
        { category: 'Qualité', question: 'Identification des défauts visuels majeurs', order: 5, points: 1 }
      ]
    },
    {
      niveau: 'Niveau 2',
      title: 'Checklist de Certification - Niveau 2 (N1 vers N2)',
      description: 'Évaluation intermédiaire sur la qualité et la technique.',
      items: [
        { category: 'Sécurité', question: 'Respect des procédures de consignation basique (LOTO)', order: 1, points: 1 },
        { category: 'Technique', question: 'Changement de format ou d\'outillage simple', order: 2, points: 1 },
        { category: 'Technique', question: 'Résolution des pannes mineures niveau 1', order: 3, points: 1 },
        { category: 'Qualité', question: 'Contrôle qualité en cours de production (KHM)', order: 4, points: 1 },
        { category: 'Maintenance', question: 'Réalisation du nettoyage et de la maintenance de 1er niveau', order: 5, points: 1 }
      ]
    },
    {
      niveau: 'Niveau 3',
      title: 'Checklist de Certification - Niveau 3 (N2 vers N3)',
      description: 'Évaluation avancée : autonomie technique et analyse.',
      items: [
        { category: 'Sécurité', question: 'Analyse des risques avant intervention complexe', order: 1, points: 1 },
        { category: 'Technique', question: 'Diagnostic de pannes complexes et lecture de schémas', order: 2, points: 2 },
        { category: 'Technique', question: 'Réglages avancés des paramètres machine', order: 3, points: 1 },
        { category: 'Qualité', question: 'Analyse des causes racines des rebuts', order: 4, points: 2 },
        { category: 'Maintenance', question: 'Réalisation de maintenance préventive niveau 2', order: 5, points: 1 },
        { category: 'Process', question: 'Formation et accompagnement des niveaux 1', order: 6, points: 1 }
      ]
    },
    {
      niveau: 'Expert',
      title: 'Checklist de Certification - Expert (N3 vers Expert)',
      description: 'Évaluation d\'expertise : maitrise totale, amélioration continue.',
      items: [
        { category: 'Sécurité', question: 'Audit et amélioration des procédures de sécurité', order: 1, points: 2 },
        { category: 'Technique', question: 'Modification ou reprogrammation d\'automatismes', order: 2, points: 3 },
        { category: 'Qualité', question: 'Mise en place d\'actions correctives et préventives durables', order: 3, points: 2 },
        { category: 'Maintenance', question: 'Optimisation du plan de maintenance préventive', order: 4, points: 2 },
        { category: 'Process', question: 'Pilotage de chantiers d\'amélioration continue (Lean/5S)', order: 5, points: 1 }
      ]
    }
  ];

  for (const tpl of templates) {
    // Upsert the template
    const createdTemplate = await prisma.formationChecklistTemplate.upsert({
      where: { niveau: tpl.niveau },
      update: {
        title: tpl.title,
        description: tpl.description,
        active: true,
      },
      create: {
        niveau: tpl.niveau,
        title: tpl.title,
        description: tpl.description,
        active: true,
      }
    });

    // Clear existing items to re-seed cleanly
    await prisma.formationChecklistItem.deleteMany({
      where: { templateId: createdTemplate.id }
    });

    // Insert items
    for (const item of tpl.items) {
      await prisma.formationChecklistItem.create({
        data: {
          templateId: createdTemplate.id,
          category: item.category,
          question: item.question,
          order: item.order,
          points: item.points
        }
      });
    }

    console.log(`Seeded template for ${tpl.niveau} with ${tpl.items.length} items.`);
  }

  console.log("Seeding complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
