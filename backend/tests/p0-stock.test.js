const request = require('supertest');
const { prisma, cleanDb } = require('./setup');
const app = require('../src/app');
const stockService = require('../src/services/stock/stockService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('P0-B — Central Stock Service & Logic Tests', () => {
  let supplier, articleA, token, superviseur;

  beforeEach(async () => {
    await cleanDb();

    // Setup base data
    supplier = await prisma.fournisseur.create({
      data: { nom: 'Fournisseur A' }
    });

    const pwd = await bcrypt.hash('password123', 10);
    superviseur = await prisma.user.create({
      data: {
        nom: 'Superviseur Test',
        matricule: 'MAT-SUP',
        email: 'sup@test.com',
        mot_de_passe: pwd,
        role: 'SUPERVISEUR'
      }
    });

    token = jwt.sign({ id: superviseur.id, role: superviseur.role, matricule: superviseur.matricule }, process.env.JWT_SECRET);

    articleA = await prisma.article.create({
      data: {
        id: 'A001',
        nom_article: 'Article Test',
        prix: 15.0,
        quantite: 100,
        min_stock: 20,
        address: 'LOC-MAIN',
        fournisseur_id: supplier.id
      }
    });

    // Seed location
    await prisma.stockLocation.create({
      data: {
        articleId: 'A001',
        location: 'LOC-MAIN',
        quantite: 100
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Stock Entry & Exit Service Methods', () => {
    it('Test 1 — Normal stock issue (100 -> 80) and movement logs created', async () => {
      await prisma.$transaction(async (tx) => {
        await stockService.issueStock(tx, {
          articleId: 'A001',
          locationName: 'LOC-MAIN',
          quantity: 20,
          matricule: 'MAT-SUP'
        });
      });

      // Verify Article
      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.quantite).toBe(80);

      // Verify StockLocation
      const loc = await prisma.stockLocation.findFirst({
        where: { articleId: 'A001', location: 'LOC-MAIN' }
      });
      expect(loc.quantite).toBe(80);

      // Verify MouvementStock
      const mvt = await prisma.mouvementStock.findFirst({
        where: { article_id: 'A001', type: 'SORTIE' }
      });
      expect(mvt).toBeDefined();
      expect(mvt.quantite).toBe(20);
      expect(mvt.reste).toBe(80);
    });

    it('Test 2 — Insufficient stock (10 vs 20) throws INSUFFICIENT_STOCK and rolls back', async () => {
      // Set stock to 10
      await prisma.article.update({ where: { id: 'A001' }, data: { quantite: 10 } });
      await prisma.stockLocation.update({
        where: { articleId_location: { articleId: 'A001', location: 'LOC-MAIN' } },
        data: { quantite: 10 }
      });

      await expect(
        prisma.$transaction(async (tx) => {
          await stockService.issueStock(tx, {
            articleId: 'A001',
            locationName: 'LOC-MAIN',
            quantity: 20,
            matricule: 'MAT-SUP'
          });
        })
      ).rejects.toThrow(/insuffisant/i);

      // Verify no database change
      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.quantite).toBe(10);

      const loc = await prisma.stockLocation.findFirst({
        where: { articleId: 'A001', location: 'LOC-MAIN' }
      });
      expect(loc.quantite).toBe(10);

      const mvts = await prisma.mouvementStock.findMany({ where: { article_id: 'A001' } });
      expect(mvts.length).toBe(0);
    });

    it('Test 3 — Multi-location allocation issue (LocA=10, LocB=20, issue 15)', async () => {
      // Setup Loc A and Loc B
      await prisma.stockLocation.deleteMany({ where: { articleId: 'A001' } });
      await prisma.article.update({ where: { id: 'A001' }, data: { quantite: 30 } });

      await prisma.stockLocation.create({
        data: { articleId: 'A001', location: 'LOC-A', quantite: 10 }
      });
      await prisma.stockLocation.create({
        data: { articleId: 'A001', location: 'LOC-B', quantite: 20 }
      });

      // Issue 15. The largest location is LOC-B (20), so it should drain from LOC-B first.
      await prisma.$transaction(async (tx) => {
        await stockService.issueStockMultiLocation(tx, {
          articleId: 'A001',
          quantity: 15,
          matricule: 'MAT-SUP'
        });
      });

      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.quantite).toBe(15);

      const locA = await prisma.stockLocation.findUnique({
        where: { articleId_location: { articleId: 'A001', location: 'LOC-A' } }
      });
      const locB = await prisma.stockLocation.findUnique({
        where: { articleId_location: { articleId: 'A001', location: 'LOC-B' } }
      });

      // LOC-B started with 20, 15 is deducted -> 5 remaining
      expect(locB.quantite).toBe(5);
      // LOC-A started with 10, untouched -> 10 remaining
      expect(locA.quantite).toBe(10);

      // Verify movements
      const mvts = await prisma.mouvementStock.findMany({
        where: { article_id: 'A001' },
        orderBy: { createdAt: 'asc' }
      });
      expect(mvts.length).toBe(1);
      expect(mvts[0].emplacement).toBe('LOC-B');
      expect(mvts[0].quantite).toBe(15);
    });
  });

  describe('Commande Receiving API integration (E2E / transactional)', () => {
    let commande;

    beforeEach(async () => {
      // Create a pending command
      commande = await prisma.commande.create({
        data: {
          reference: 'CMD-002',
          fournisseur_id: supplier.id,
          status: 'PENDING',
          total: 150,
          lignes: {
            create: [
              { article_id: 'A001', quantite: 10, prix: 15.0 }
            ]
          }
        }
      });
    });

    it('Test 4 — Commande receiving adds stock, updates location, creates ENTREE, marks RECEIVED', async () => {
      // GL user token
      const glUser = await prisma.user.create({
        data: {
          nom: 'Ghazi',
          matricule: 'MAT-GL-1',
          email: 'ghazi@test.com',
          mot_de_passe: 'pwd',
          role: 'GL'
        }
      });
      const glToken = jwt.sign({ id: glUser.id, role: glUser.role, matricule: glUser.matricule }, process.env.JWT_SECRET);

      const res = await request(app)
        .put(`/commandes/${commande.id}/receive`)
        .set('Authorization', `Bearer ${glToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('RECEIVED');

      // Verify Article
      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.quantite).toBe(110); // 100 base + 10 received

      // Verify StockLocation
      const loc = await prisma.stockLocation.findUnique({
        where: { articleId_location: { articleId: 'A001', location: 'LOC-MAIN' } }
      });
      expect(loc.quantite).toBe(110);

      // Verify Mouvement
      const mvt = await prisma.mouvementStock.findFirst({
        where: { article_id: 'A001', type: 'ENTREE', po_reference: 'CMD-002' }
      });
      expect(mvt).toBeDefined();
      expect(mvt.quantite).toBe(10);
      expect(mvt.reste).toBe(110);
    });

    it('Test 5 — Commande receiving failure (invalid quantity) leaves commande unreceived and no stock changes', async () => {
      // Make a command with valid article first
      const badCommande = await prisma.commande.create({
        data: {
          reference: 'CMD-BAD',
          fournisseur_id: supplier.id,
          status: 'PENDING',
          total: 150,
          lignes: {
            create: [
              { article_id: 'A001', quantite: 10, prix: 15.0 }
            ]
          }
        },
        include: { lignes: true }
      });

      // Update the command line directly to bypass initial zod validation and have negative quantity
      await prisma.commandeLigne.update({
        where: { id: badCommande.lignes[0].id },
        data: { quantite: -10 }
      });

      const glUser = await prisma.user.create({
        data: {
          nom: 'Ghazi Bad',
          matricule: 'MAT-GL-BAD',
          email: 'ghazi-bad@test.com',
          mot_de_passe: 'pwd',
          role: 'GL'
        }
      });
      const glToken = jwt.sign({ id: glUser.id, role: glUser.role, matricule: glUser.matricule }, process.env.JWT_SECRET);

      const res = await request(app)
        .put(`/commandes/${badCommande.id}/receive`)
        .set('Authorization', `Bearer ${glToken}`)
        .send();

      expect(res.status).toBe(400); // Bad request / error
      expect(res.body.error).toContain('invalide');

      // Verify commande remains pending
      const cmd = await prisma.commande.findUnique({ where: { id: badCommande.id } });
      expect(cmd.status).toBe('PENDING');

      // Verify stock untouched (should remain 100, not 90 or 110)
      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.quantite).toBe(100);
    });
  });

  describe('Panneau Material Consumption', () => {
    let bom, entrepot, superviseurUser, panneau;

    beforeEach(async () => {
      // Setup BOM
      bom = await prisma.bOM.create({
        data: {
          nom_projet: 'Project X',
          nom_bom: 'BOM-101',
          jig: 'J-01',
          contrepartie: 'C-01',
          clip: 'Clip-01',
          lignes: {
            create: [
              { article_id: 'A001', quantite: 20, prix: 15.0 }
            ]
          }
        }
      });

      entrepot = await prisma.entrepot.create({
        data: { nom: 'Entrepot Main', emplacement: 'EMP-01' }
      });

      // Create supervisor user
      superviseurUser = await prisma.user.findUnique({ where: { matricule: 'MAT-SUP' } });

      panneau = await prisma.panneau.create({
        data: {
          id: 'PNL-TEST',
          title_panneau: 'Panneau 1',
          title_project: 'Project X',
          etat_construction: 'EN_CONSTRUCTION',
          etat_validation: 'EN_ATTENTE',
          etat_khm: 'EN_ATTENTE',
          status: 'READY',
          bom_id: bom.id,
          entrepot_id: entrepot.id,
          superviseur_id: superviseurUser.id
        }
      });
    });

    it('Test 6 — Panneau consumption: valid stock -> stock decreases, locations update, movement created', async () => {
      // Transition EN_CONSTRUCTION -> EN_VALIDATION triggers handleStockSortieForValidation
      const res = await request(app)
        .patch(`/panneaux/${panneau.id}/etat`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          etat_construction: 'EN_VALIDATION'
        });

      expect(res.status).toBe(200);

      // Verify stock decreased by 20 (BOM quantity)
      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.quantite).toBe(80); // 100 base - 20 BOM

      // Verify location updated
      const loc = await prisma.stockLocation.findUnique({
        where: { articleId_location: { articleId: 'A001', location: 'LOC-MAIN' } }
      });
      expect(loc.quantite).toBe(80);

      // Verify movement SORTIE created
      const mvt = await prisma.mouvementStock.findFirst({
        where: { article_id: 'A001', type: 'SORTIE' }
      });
      expect(mvt).toBeDefined();
      expect(mvt.quantite).toBe(20);
    });

    it('Test 7 — Panneau insufficient stock: transition fails, stock remains unchanged', async () => {
      // Make stock insufficient (e.g. 10)
      await prisma.article.update({ where: { id: 'A001' }, data: { quantite: 10 } });
      await prisma.stockLocation.update({
        where: { articleId_location: { articleId: 'A001', location: 'LOC-MAIN' } },
        data: { quantite: 10 }
      });

      // Transition EN_CONSTRUCTION -> EN_VALIDATION triggers handleStockSortieForValidation
      const res = await request(app)
        .patch(`/panneaux/${panneau.id}/etat`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          etat_construction: 'EN_VALIDATION'
        });

      // Should return error response
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('insuffisant');

      // Verify panneau status remains unchanged (still EN_CONSTRUCTION)
      const pnl = await prisma.panneau.findUnique({ where: { id: panneau.id } });
      expect(pnl.etat_construction).toBe('EN_CONSTRUCTION');

      // Verify stock remains 10
      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.quantite).toBe(10);
    });
  });

  describe('Atomic Rollback Protection', () => {
    it('Test 8 — Force a failure after stock mutation but before transaction completion', async () => {
      // Let's call issueStock and then throw an error inside transaction
      await expect(
        prisma.$transaction(async (tx) => {
          await stockService.issueStock(tx, {
            articleId: 'A001',
            locationName: 'LOC-MAIN',
            quantity: 10,
            matricule: 'MAT-SUP'
          });

          throw new Error('Forced failure to trigger rollback');
        })
      ).rejects.toThrow('Forced failure to trigger rollback');

      // Verify database restored completely
      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.quantite).toBe(100);

      const loc = await prisma.stockLocation.findUnique({
        where: { articleId_location: { articleId: 'A001', location: 'LOC-MAIN' } }
      });
      expect(loc.quantite).toBe(100);

      const mvts = await prisma.mouvementStock.findMany({ where: { article_id: 'A001' } });
      expect(mvts.length).toBe(0);
    });
  });
});
