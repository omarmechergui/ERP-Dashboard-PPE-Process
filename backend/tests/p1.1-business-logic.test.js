const request = require('supertest');
const { prisma, cleanDb } = require('./setup');
const app = require('../src/app');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let adminToken;

describe('P1.1 — Reservation & Panneau Business Logic', () => {
  let supplier, articleA, token, superviseur;

  beforeEach(async () => {
    await cleanDb();

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

    const adminUser = await prisma.user.create({
      data: {
        nom: 'Admin Test',
        matricule: 'MAT-ADMIN',
        email: 'admin@test.com',
        mot_de_passe: pwd,
        role: 'ADMIN'
      }
    });
    adminToken = jwt.sign({ id: adminUser.id, role: adminUser.role, matricule: adminUser.matricule }, process.env.JWT_SECRET);

    articleA = await prisma.article.create({
      data: {
        id: 'A001',
        nom_article: 'Article Test',
        prix: 15.0,
        quantite: 100,
        reserved_qty: 0,
        min_stock: 20,
        address: 'LOC-MAIN',
        fournisseur_id: supplier.id
      }
    });

    await prisma.stockLocation.create({
      data: { articleId: 'A001', location: 'LOC-MAIN', quantite: 100 }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ═══════════════════════════════════════════════
  // CUSTOMER RESERVATION LIFECYCLE (Tests 1-15)
  // ═══════════════════════════════════════════════

  describe('Customer Reservation Lifecycle', () => {

    it('Test 1 — Create EN_ATTENTE reservation', async () => {
      const res = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          client: 'Client A',
          lignes: [{ article_id: 'A001', quantite: 10 }]
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('EN_ATTENTE');
    });

    it('Test 2 — Reserved quantity increases correctly on creation', async () => {
      await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          client: 'Client A',
          lignes: [{ article_id: 'A001', quantite: 10 }]
        });

      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.reserved_qty).toBe(10);
      expect(art.quantite).toBe(100); // physical stock untouched
    });

    it('Test 3 — Validate EN_ATTENTE → VALIDEE (no physical stock change)', async () => {
      const created = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client: 'Client A', lignes: [{ article_id: 'A001', quantite: 10 }] });

      const res = await request(app)
        .patch(`/reservations/${created.body.id}/validate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('VALIDEE');

      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.reserved_qty).toBe(10); // unchanged
      expect(art.quantite).toBe(100);    // unchanged
    });

    it('Test 4 — Validate ANNULEE → rejected', async () => {
      const created = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client: 'Client A', lignes: [{ article_id: 'A001', quantite: 10 }] });

      // Cancel first
      await request(app)
        .patch(`/reservations/${created.body.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Try to validate
      const res = await request(app)
        .patch(`/reservations/${created.body.id}/validate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('Test 5 — Consume VALIDEE reservation: physical stock decreases', async () => {
      const created = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client: 'Client A', lignes: [{ article_id: 'A001', quantite: 10 }] });

      await request(app)
        .patch(`/reservations/${created.body.id}/validate`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .patch(`/reservations/${created.body.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.quantite).toBe(90); // 100 - 10
    });

    it('Test 6 — Consume releases reserved quantity', async () => {
      const created = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client: 'Client A', lignes: [{ article_id: 'A001', quantite: 10 }] });

      await request(app)
        .patch(`/reservations/${created.body.id}/validate`)
        .set('Authorization', `Bearer ${adminToken}`);

      await request(app)
        .patch(`/reservations/${created.body.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`);

      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.reserved_qty).toBe(0);
    });

    it('Test 7 — Consume creates MouvementStock', async () => {
      const created = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client: 'Client A', lignes: [{ article_id: 'A001', quantite: 10 }] });

      await request(app)
        .patch(`/reservations/${created.body.id}/validate`)
        .set('Authorization', `Bearer ${adminToken}`);

      await request(app)
        .patch(`/reservations/${created.body.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`);

      const mvt = await prisma.mouvementStock.findFirst({
        where: { article_id: 'A001', type: 'SORTIE' }
      });
      expect(mvt).toBeDefined();
      expect(mvt.quantite).toBe(10);
    });

    it('Test 8 — Consume sets status to CONSUMED', async () => {
      const created = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client: 'Client A', lignes: [{ article_id: 'A001', quantite: 10 }] });

      await request(app)
        .patch(`/reservations/${created.body.id}/validate`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .patch(`/reservations/${created.body.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.status).toBe('CONSUMED');
    });

    it('Test 9 — Cancel EN_ATTENTE releases reserved_qty', async () => {
      const created = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client: 'Client A', lignes: [{ article_id: 'A001', quantite: 10 }] });

      const res = await request(app)
        .patch(`/reservations/${created.body.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ANNULEE');

      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.reserved_qty).toBe(0);
      expect(art.quantite).toBe(100); // physical untouched
    });

    it('Test 10 — Cancel VALIDEE releases reserved_qty', async () => {
      const created = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client: 'Client A', lignes: [{ article_id: 'A001', quantite: 10 }] });

      await request(app)
        .patch(`/reservations/${created.body.id}/validate`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .patch(`/reservations/${created.body.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ANNULEE');

      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.reserved_qty).toBe(0);
    });

    it('Test 11 — Cancel twice safely (rejects second cancel)', async () => {
      const created = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client: 'Client A', lignes: [{ article_id: 'A001', quantite: 10 }] });

      await request(app)
        .patch(`/reservations/${created.body.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .patch(`/reservations/${created.body.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('Test 12 — Consume twice safely (rejects second consume)', async () => {
      const created = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client: 'Client A', lignes: [{ article_id: 'A001', quantite: 10 }] });

      await request(app)
        .patch(`/reservations/${created.body.id}/validate`)
        .set('Authorization', `Bearer ${adminToken}`);

      await request(app)
        .patch(`/reservations/${created.body.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .patch(`/reservations/${created.body.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('Test 13 — Consume ANNULEE rejected', async () => {
      const created = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client: 'Client A', lignes: [{ article_id: 'A001', quantite: 10 }] });

      await request(app)
        .patch(`/reservations/${created.body.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .patch(`/reservations/${created.body.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('Test 14 — Insufficient stock rollback during consume', async () => {
      const created = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client: 'Client A', lignes: [{ article_id: 'A001', quantite: 10 }] });

      await request(app)
        .patch(`/reservations/${created.body.id}/validate`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Manually set physical stock to 5 (less than reserved 10)
      await prisma.article.update({ where: { id: 'A001' }, data: { quantite: 5 } });
      await prisma.stockLocation.update({
        where: { articleId_location: { articleId: 'A001', location: 'LOC-MAIN' } },
        data: { quantite: 5 }
      });

      const res = await request(app)
        .patch(`/reservations/${created.body.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('insuffisant');

      // State should NOT have changed
      const reservation = await prisma.reservation.findUnique({ where: { id: created.body.id } });
      expect(reservation.status).toBe('VALIDEE');

      // reserved_qty should remain
      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.reserved_qty).toBe(10);
    });

    it('Test 15 — Transaction rollback after forced failure (article deleted)', async () => {
      const created = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client: 'Client A', lignes: [{ article_id: 'A001', quantite: 10 }] });

      await request(app)
        .patch(`/reservations/${created.body.id}/validate`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Force a failure by artificially removing the reserved quantity 
      // directly in the DB, bypassing normal logic.
      await prisma.article.update({
        where: { id: 'A001' },
        data: { reserved_qty: 0 }
      });

      const res = await request(app)
        .patch(`/reservations/${created.body.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);

      // Reservation should still be VALIDEE
      const reservation = await prisma.reservation.findUnique({ where: { id: created.body.id } });
      expect(reservation.status).toBe('VALIDEE');
    });
  });

  // ═══════════════════════════════════════════════
  // PANNEAU TESTS (Tests 16-20)
  // ═══════════════════════════════════════════════

  describe('Panneau Material Consumption', () => {
    let bom, entrepot;

    beforeEach(async () => {
      bom = await prisma.bOM.create({
        data: {
          nom_projet: 'Project X',
          nom_bom: 'BOM-P11',
          jig: 'J-01',
          contrepartie: 'C-01',
          clip: 'Clip-01',
          lignes: {
            create: [{ article_id: 'A001', quantite: 20, prix: 15.0 }]
          }
        }
      });

      entrepot = await prisma.entrepot.create({
        data: { nom: 'Entrepot Main', emplacement: 'EMP-01' }
      });
    });

    it('Test 16 — Creating a Panneau does NOT create untraceable global reserved_qty', async () => {
      const res = await request(app)
        .post('/panneaux')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: 'PNL-P11-01',
          title_panneau: 'Panneau 1',
          title_project: 'Project X',
          bom_id: bom.id,
          entrepot_id: entrepot.id,
          superviseur_id: 'MAT-SUP'
        });

      expect(res.status).toBe(201);

      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.reserved_qty).toBe(0); // No phantom reservation
    });

    it('Test 17 — Panneau consumption uses StockService (issueStockMultiLocation)', async () => {
      const panneau = await prisma.panneau.create({
        data: {
          id: 'PNL-P11-02',
          title_panneau: 'Panneau 2',
          title_project: 'Project X',
          etat_construction: 'EN_CONSTRUCTION',
          bom_id: bom.id,
          entrepot_id: entrepot.id,
          superviseur_id: superviseur.id
        }
      });

      const res = await request(app)
        .patch(`/panneaux/${panneau.id}/etat`)
        .set('Authorization', `Bearer ${token}`)
        .send({ etat_construction: 'EN_VALIDATION' });

      expect(res.status).toBe(200);

      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.quantite).toBe(80); // 100 - 20 BOM
    });

    it('Test 18 — Insufficient Panneau stock rolls back', async () => {
      const panneau = await prisma.panneau.create({
        data: {
          id: 'PNL-P11-03',
          title_panneau: 'Panneau 3',
          title_project: 'Project X',
          etat_construction: 'EN_CONSTRUCTION',
          bom_id: bom.id,
          entrepot_id: entrepot.id,
          superviseur_id: superviseur.id
        }
      });

      await prisma.article.update({ where: { id: 'A001' }, data: { quantite: 10 } });
      await prisma.stockLocation.update({
        where: { articleId_location: { articleId: 'A001', location: 'LOC-MAIN' } },
        data: { quantite: 10 }
      });

      const res = await request(app)
        .patch(`/panneaux/${panneau.id}/etat`)
        .set('Authorization', `Bearer ${token}`)
        .send({ etat_construction: 'EN_VALIDATION' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('insuffisant');

      const art = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(art.quantite).toBe(10); // unchanged
    });

    it('Test 19 — Panneau status does not advance after failed consumption', async () => {
      const panneau = await prisma.panneau.create({
        data: {
          id: 'PNL-P11-04',
          title_panneau: 'Panneau 4',
          title_project: 'Project X',
          etat_construction: 'EN_CONSTRUCTION',
          bom_id: bom.id,
          entrepot_id: entrepot.id,
          superviseur_id: superviseur.id
        }
      });

      await prisma.article.update({ where: { id: 'A001' }, data: { quantite: 5 } });
      await prisma.stockLocation.update({
        where: { articleId_location: { articleId: 'A001', location: 'LOC-MAIN' } },
        data: { quantite: 5 }
      });

      await request(app)
        .patch(`/panneaux/${panneau.id}/etat`)
        .set('Authorization', `Bearer ${token}`)
        .send({ etat_construction: 'EN_VALIDATION' });

      const pnl = await prisma.panneau.findUnique({ where: { id: panneau.id } });
      expect(pnl.etat_construction).toBe('EN_CONSTRUCTION');
    });

    it('Test 20 — Panneau consumption creates correct stock movement', async () => {
      const panneau = await prisma.panneau.create({
        data: {
          id: 'PNL-P11-05',
          title_panneau: 'Panneau 5',
          title_project: 'Project X',
          etat_construction: 'EN_CONSTRUCTION',
          bom_id: bom.id,
          entrepot_id: entrepot.id,
          superviseur_id: superviseur.id
        }
      });

      await request(app)
        .patch(`/panneaux/${panneau.id}/etat`)
        .set('Authorization', `Bearer ${token}`)
        .send({ etat_construction: 'EN_VALIDATION' });

      const mvt = await prisma.mouvementStock.findFirst({
        where: { article_id: 'A001', type: 'SORTIE' }
      });
      expect(mvt).toBeDefined();
      expect(mvt.quantite).toBe(20);
      expect(mvt.emplacement).toBe('LOC-MAIN');
    });
  });
});
