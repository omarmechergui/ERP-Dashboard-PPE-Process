const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // 1. Clean existing data
  await prisma.khmControl.deleteMany({});
  await prisma.panneauTimeline.deleteMany({});
  await prisma.panneauOperator.deleteMany({});
  await prisma.panneauChecklist.deleteMany({});
  await prisma.panneauDefect.deleteMany({});
  await prisma.panneauScrap.deleteMany({});
  await prisma.panneauHistory.deleteMany({});
  await prisma.mouvementStock.deleteMany({});
  await prisma.panneau.deleteMany({});
  await prisma.planification.deleteMany({});
  await prisma.bomLigne.deleteMany({});
  await prisma.reservationLigne.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.commandeLigne.deleteMany({});
  await prisma.commande.deleteMany({});
  await prisma.article.deleteMany({});
  await prisma.fournisseur.deleteMany({});
  await prisma.bOM.deleteMany({});
  await prisma.entrepot.deleteMany({});
  await prisma.userAuditLog.deleteMany({});
  await prisma.organigrammeHistory.deleteMany({});
  await prisma.organigramme.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      nom: 'Ahmed Kacem',
      matricule: 'MAT-001',
      email: 'a.kacem@usine.tn',
      mot_de_passe: passwordHash,
      role: 'ADMIN',
      statut: 'ACTIF',
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      nom: 'Sonia Manager',
      matricule: 'MAT-002',
      email: 's.manager@usine.tn',
      mot_de_passe: passwordHash,
      role: 'MANAGER',
      statut: 'ACTIF',
      managerId: adminUser.id,
      department: 'Direction',
    },
  });

  const glUser = await prisma.user.create({
    data: {
      nom: 'Ghazi Larbi',
      matricule: 'MAT-014',
      email: 'g.larbi@usine.tn',
      mot_de_passe: passwordHash,
      role: 'GL',
      statut: 'ACTIF',
      managerId: managerUser.id,
      department: 'Production',
    },
  });

  const supervisorKarim = await prisma.user.create({
    data: {
      nom: 'Mehdi Karim',
      matricule: 'MAT-022',
      email: 'm.karim@usine.tn',
      mot_de_passe: passwordHash,
      role: 'SUPERVISEUR',
      statut: 'ACTIF',
      managerId: glUser.id,
      department: 'Production',
    },
  });

  const supervisorSami = await prisma.user.create({
    data: {
      nom: 'Sami Lahmar',
      matricule: 'MAT-031',
      email: 's.lahmar@usine.tn',
      mot_de_passe: passwordHash,
      role: 'SUPERVISEUR',
      statut: 'INACTIF',
      managerId: glUser.id,
      department: 'Production',
    },
  });

  const operatorFatma = await prisma.user.create({
    data: {
      nom: 'Fatma Zahra',
      matricule: 'MAT-045',
      email: 'f.zahra@usine.tn',
      mot_de_passe: passwordHash,
      role: 'OPERATEUR',
      statut: 'ACTIF',
      managerId: supervisorKarim.id,
      department: 'Production',
    },
  });

  console.log('Users created with manager relationships.');

  // Organigrammes
  const orgBrouillon = await prisma.organigramme.create({
    data: {
      titre: 'Brouillon V2',
      description: 'Prochain org',
      snapshot: '{}',
      statut: 'BROUILLON',
      version: 2,
      createdBy: adminUser.id
    }
  });

  const orgValide = await prisma.organigramme.create({
    data: {
      titre: 'Organisation Actuelle',
      description: 'Organisation en cours',
      snapshot: '{}',
      statut: 'VALIDE',
      version: 1,
      createdBy: adminUser.id,
      submittedBy: adminUser.id,
      validatedBy: managerUser.id,
      submittedAt: new Date(),
      validatedAt: new Date()
    }
  });

  await prisma.organigrammeHistory.create({
    data: {
      organigramme_id: orgValide.id,
      previous_status: 'BROUILLON',
      new_status: 'EN_VALIDATION',
      user_id: adminUser.id,
      comment: 'Soumis pour validation'
    }
  });

  await prisma.organigrammeHistory.create({
    data: {
      organigramme_id: orgValide.id,
      previous_status: 'EN_VALIDATION',
      new_status: 'VALIDE',
      user_id: managerUser.id,
      comment: 'Validé'
    }
  });

  console.log('Organigrammes created.');

  // 3. Create Fournisseurs
  const fournA = await prisma.fournisseur.create({ data: { nom: 'Fournisseur A', contact: 'contact-a@test.com' } });
  const fournB = await prisma.fournisseur.create({ data: { nom: 'Fournisseur B', contact: 'contact-b@test.com' } });
  const fournC = await prisma.fournisseur.create({ data: { nom: 'Fournisseur C', contact: 'contact-c@test.com' } });

  console.log('Fournisseurs created.');

  // 4. Create Articles
  const art1 = await prisma.article.create({
    data: { id: 'A001', nom_article: 'Connecteur JST-6P', prix: 0.85, quantite: 2400, min_stock: 100, address: "C1", fournisseur_id: fournA.id },
  });
  const art2 = await prisma.article.create({
    data: { id: 'A002', nom_article: 'Fil AWG 18 rouge', prix: 1.20, quantite: 45, min_stock: 50, address: "C1", fournisseur_id: fournB.id },
  });
  const art3 = await prisma.article.create({
    data: { id: 'A003', nom_article: 'Clip fixation 8mm', prix: 0.15, quantite: 9800, min_stock: 200, address: "C1", fournisseur_id: fournA.id },
  });
  const art4 = await prisma.article.create({
    data: { id: 'A004', nom_article: 'Gaine thermo 4mm', prix: 0.60, quantite: 180, min_stock: 100, address: "C1", fournisseur_id: fournC.id },
  });
  const art5 = await prisma.article.create({
    data: { id: 'A005', nom_article: 'Jig support panneau X4', prix: 45.00, quantite: 12, min_stock: 5, address: "C1", fournisseur_id: fournB.id },
  });

  console.log('Articles created.');

  // 5. Create BOMs
  const bom14 = await prisma.bOM.create({
    data: { nom_projet: 'Projet Alpha', nom_bom: 'BOM-2026-014', jig: 'JIG-X4-A', contrepartie: 'CP-220', clip: 'CL-08' },
  });
  const bom13 = await prisma.bOM.create({
    data: { nom_projet: 'Projet Beta', nom_bom: 'BOM-2026-013', jig: 'JIG-X4-B', contrepartie: 'CP-221', clip: 'CL-09' },
  });
  const bom12 = await prisma.bOM.create({
    data: { nom_projet: 'Projet Gamma', nom_bom: 'BOM-2026-012', jig: 'JIG-X4-C', contrepartie: 'CP-222', clip: 'CL-10' },
  });
  const bom11 = await prisma.bOM.create({
    data: { nom_projet: 'Projet Alpha', nom_bom: 'BOM-2026-011', jig: 'JIG-X4-A', contrepartie: 'CP-220', clip: 'CL-08' },
  });

  // BOM Lines for BOM-2026-014
  await prisma.bomLigne.create({ data: { bom_id: bom14.id, article_id: art1.id, quantite: 40, prix: 0.85 } });
  await prisma.bomLigne.create({ data: { bom_id: bom14.id, article_id: art2.id, quantite: 15, prix: 1.20 } });
  await prisma.bomLigne.create({ data: { bom_id: bom14.id, article_id: art3.id, quantite: 60, prix: 0.15 } });

  console.log('BOMs & BOM Lines created.');

  // 6. Create Entrepôts
  const entrepotPrincipal = await prisma.entrepot.create({ data: { nom: 'Entrepot principal', emplacement: 'Aile A' } });
  const entrepotSecondaire = await prisma.entrepot.create({ data: { nom: 'Entrepot secondaire', emplacement: 'Aile B' } });

  console.log('Entrepôts created.');

  // 7. Create Planifications
  const plan1 = await prisma.planification.create({
    data: {
      title: 'Lancement Projet Alpha',
      date_debut: new Date('2026-07-02'),
      date_fin: new Date('2026-07-18'),
      matricule_gl: glUser.matricule,
      matricule_superviseur: supervisorKarim.matricule,
      statut_pourcentage: 65,
    },
  });

  const plan2 = await prisma.planification.create({
    data: {
      title: 'Réassort composants Beta',
      date_debut: new Date('2026-07-05'),
      date_fin: new Date('2026-07-12'),
      matricule_gl: glUser.matricule,
      matricule_superviseur: supervisorSami.matricule,
      statut_pourcentage: 30,
    },
  });

  const plan3 = await prisma.planification.create({
    data: {
      title: 'Contrôle qualité Gamma',
      date_debut: new Date('2026-07-01'),
      date_fin: new Date('2026-07-10'),
      matricule_gl: glUser.matricule,
      matricule_superviseur: adminUser.matricule,
      statut_pourcentage: 90,
    },
  });

  const plan4 = await prisma.planification.create({
    data: {
      title: 'Préparation stock Alpha 2',
      date_debut: new Date('2026-07-08'),
      date_fin: new Date('2026-07-20'),
      matricule_gl: glUser.matricule,
      matricule_superviseur: supervisorKarim.matricule,
      statut_pourcentage: 5,
    },
  });

  console.log('Planifications created.');

  // 8. Create Panneaux
  const pnl104 = await prisma.panneau.create({
    data: {
      id: 'PNL-104',
      title_panneau: 'PNL-104',
      title_project: 'Projet Alpha',
      etat_construction: 'EN_CONSTRUCTION',
      etat_validation: 'EN_ATTENTE',
      etat_khm: 'EN_ATTENTE',
      bom_id: bom14.id,
      entrepot_id: entrepotPrincipal.id,
      superviseur_id: supervisorKarim.id,
    },
  });

  const pnl107 = await prisma.panneau.create({
    data: {
      id: 'PNL-107',
      title_panneau: 'PNL-107',
      title_project: 'Projet Gamma',
      etat_construction: 'EN_CONSTRUCTION',
      etat_validation: 'EN_ATTENTE',
      etat_khm: 'EN_ATTENTE',
      bom_id: bom12.id,
      entrepot_id: entrepotSecondaire.id,
      superviseur_id: supervisorSami.id,
    },
  });

  const pnl098 = await prisma.panneau.create({
    data: {
      id: 'PNL-098',
      title_panneau: 'PNL-098',
      title_project: 'Projet Beta',
      etat_construction: 'EN_VALIDATION',
      etat_validation: 'EN_ATTENTE',
      etat_khm: 'EN_ATTENTE',
      bom_id: bom13.id,
      entrepot_id: entrepotPrincipal.id,
      superviseur_id: adminUser.id,
    },
  });

  const pnl091 = await prisma.panneau.create({
    data: {
      id: 'PNL-091',
      title_panneau: 'PNL-091',
      title_project: 'Projet Alpha',
      etat_construction: 'KHM',
      etat_validation: 'VALIDE',
      etat_khm: 'EN_ATTENTE',
      bom_id: bom14.id,
      entrepot_id: entrepotPrincipal.id,
      superviseur_id: supervisorKarim.id,
    },
  });

  const pnl085 = await prisma.panneau.create({
    data: {
      id: 'PNL-085',
      title_panneau: 'PNL-085',
      title_project: 'Projet Beta',
      etat_construction: 'TERMINE',
      etat_validation: 'VALIDE',
      etat_khm: 'CONFORME',
      bom_id: bom13.id,
      entrepot_id: entrepotPrincipal.id,
      superviseur_id: supervisorSami.id,
    },
  });

  const pnl080 = await prisma.panneau.create({
    data: {
      id: 'PNL-080',
      title_panneau: 'PNL-080',
      title_project: 'Projet Gamma',
      etat_construction: 'TERMINE',
      etat_validation: 'VALIDE',
      etat_khm: 'CONFORME',
      bom_id: bom12.id,
      entrepot_id: entrepotSecondaire.id,
      superviseur_id: adminUser.id,
    },
  });

  const pnl079 = await prisma.panneau.create({
    data: {
      id: 'PNL-079',
      title_panneau: 'PNL-079',
      title_project: 'Projet Gamma',
      etat_construction: 'EN_CONSTRUCTION',
      etat_validation: 'REJETE',
      etat_khm: 'NON_CONFORME',
      bom_id: bom12.id,
      entrepot_id: entrepotSecondaire.id,
      superviseur_id: adminUser.id,
    },
  });

  console.log('Panneaux created.');

  // 8.5 Create Machines from Panneaux
  const panneaux = [pnl104, pnl107, pnl098, pnl091, pnl085, pnl080, pnl079];
  for (const pnl of panneaux) {
    await prisma.machine.create({
      data: {
        nom: pnl.title_panneau,
        code: pnl.id,
        departement: pnl.title_project,
        status: 'RUNNING'
      }
    });
  }
  console.log('Machines created from Panneaux.');

  // 9. Stock Movements
  // Entrées
  await prisma.mouvementStock.create({
    data: {
      type: 'ENTREE',
      po_reference: 'PO-2026-341',
      planification_id: plan1.id,
      article_id: art1.id,
      emplacement: 'A-12',
      quantite: 500,
      etat: true,
      reste: 2400, // Matching mockup remaining
    },
  });

  await prisma.mouvementStock.create({
    data: {
      type: 'ENTREE',
      po_reference: 'PO-2026-342',
      planification_id: plan1.id,
      article_id: art3.id,
      emplacement: 'A-03',
      quantite: 1000,
      etat: true,
      reste: 9800,
    },
  });

  await prisma.mouvementStock.create({
    data: {
      type: 'ENTREE',
      po_reference: 'PO-2026-345',
      planification_id: plan1.id,
      article_id: art4.id,
      emplacement: 'C-01',
      quantite: 200,
      etat: false,
      reste: 180,
    },
  });

  // Sortie
  await prisma.mouvementStock.create({
    data: {
      type: 'SORTIE',
      article_id: art2.id,
      emplacement: 'B-04',
      quantite: 120,
      matricule: 'MAT-045',
      reste: 45,
    },
  });

  console.log('Mouvements stock created.');

  // 10. KHM Controls
  await prisma.khmControl.create({
    data: {
      panneau_id: pnl091.id,
      etat: 'EN_ATTENTE',
      matricule_superviseur: supervisorKarim.matricule,
    },
  });

  await prisma.khmControl.create({
    data: {
      panneau_id: pnl085.id,
      etat: 'CONFORME',
      matricule_superviseur: supervisorSami.matricule,
      commentaire: 'Contrôle visuel et électrique OK, aucun défaut relevé.',
    },
  });

  await prisma.khmControl.create({
    data: {
      panneau_id: pnl079.id,
      etat: 'NON_CONFORME',
      matricule_superviseur: adminUser.matricule,
      commentaire: 'Défaut de sertissage sur connecteur 3, panneau renvoyé en construction.',
    },
  });

  console.log('KHM Controls created.');

  // 11. FormationCatalog Seeding
  const defaultFormations = ['Sertissage', 'Presse Clip', 'Test', 'Electrique', 'Automatismes', 'Pneumatique'];
  for (const name of defaultFormations) {
    await prisma.formationCatalog.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('FormationCatalog seeded.');

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
