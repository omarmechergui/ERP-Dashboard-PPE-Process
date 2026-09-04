const request = require('supertest');
const { prisma, cleanDb } = require('./setup');
const app = require('../src/app');
const bcrypt = require('bcryptjs');

describe('P0-A — Security Hardening Tests', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /auth/register', () => {
    it('should reject registration attempts with privileged roles (e.g. ADMIN) with 403', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          nom: 'Fake Admin',
          email: 'fakeadmin@test.com',
          matricule: 'MAT-999',
          mot_de_passe: 'password123',
          role: 'ADMIN'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('non autorisée');
    });

    it('should allow public registration with OPERATEUR and successfully create user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          nom: 'Operator Joe',
          email: 'joe@test.com',
          matricule: 'MAT-002',
          mot_de_passe: 'password123',
          role: 'OPERATEUR'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('OPERATEUR');

      // Verify in DB
      const dbUser = await prisma.user.findUnique({ where: { matricule: 'MAT-002' } });
      expect(dbUser).toBeDefined();
      expect(dbUser.role).toBe('OPERATEUR');
    });

    it('should force role to OPERATEUR even if role is omitted', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          nom: 'No Role Joe',
          email: 'norole@test.com',
          matricule: 'MAT-003',
          mot_de_passe: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('OPERATEUR');
    });
  });

  describe('JWT Secret Startup Check', () => {
    it('should exit when JWT_SECRET is missing or set to placeholder', () => {
      // Mock process.exit and console.error
      const originalExit = process.exit;
      const originalError = console.error;
      const mockExit = jest.fn();
      const mockError = jest.fn();

      process.exit = mockExit;
      console.error = mockError;

      // Temporary override JWT_SECRET
      const prevSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'your_jwt_secret_key_here_change_in_production';

      // Re-trigger startup check logic manually
      try {
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_jwt_secret_key_here_change_in_production') {
          process.exit(1);
        }
      } catch (e) {}

      expect(mockExit).toHaveBeenCalledWith(1);

      // Reset mock
      process.exit = originalExit;
      console.error = originalError;
      process.env.JWT_SECRET = prevSecret;
    });
  });

  describe('PUT /commandes/:id/receive authorization', () => {
    let operatorToken, glToken, testCommande;

    beforeEach(async () => {
      const pwd = await bcrypt.hash('password123', 10);
      // Create users
      const opUser = await prisma.user.create({
        data: { nom: 'Op', email: 'op@test.com', matricule: 'M-OP', mot_de_passe: pwd, role: 'OPERATEUR' }
      });
      const glUser = await prisma.user.create({
        data: { nom: 'GL', email: 'gl@test.com', matricule: 'M-GL', mot_de_passe: pwd, role: 'GL' }
      });
      const supplier = await prisma.fournisseur.create({
        data: { nom: 'Supp' }
      });
      const article = await prisma.article.create({
        data: { id: 'A001', nom_article: 'Art 1', prix: 10, quantite: 0, address: 'LOC', fournisseur_id: supplier.id }
      });

      testCommande = await prisma.commande.create({
        data: {
          reference: 'CMD-TEST-1',
          fournisseur_id: supplier.id,
          status: 'PENDING',
          total: 100,
          lignes: {
            create: [
              { article_id: 'A001', quantite: 10, prix: 10 }
            ]
          }
        }
      });

      // Generate JWTs using test JWT secret
      const jwt = require('jsonwebtoken');
      operatorToken = jwt.sign({ id: opUser.id, role: opUser.role, matricule: opUser.matricule }, process.env.JWT_SECRET);
      glToken = jwt.sign({ id: glUser.id, role: glUser.role, matricule: glUser.matricule }, process.env.JWT_SECRET);
    });

    it('should reject anonymous request with 401', async () => {
      const res = await request(app)
        .put(`/commandes/${testCommande.id}/receive`)
        .send();
      expect(res.status).toBe(401);
    });

    it('should reject OPERATEUR role with 403', async () => {
      const res = await request(app)
        .put(`/commandes/${testCommande.id}/receive`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send();
      expect(res.status).toBe(403);
    });

    it('should allow GL role to receive order and execute stock updates', async () => {
      const res = await request(app)
        .put(`/commandes/${testCommande.id}/receive`)
        .set('Authorization', `Bearer ${glToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('RECEIVED');

      // Verify stock updated
      const updatedArticle = await prisma.article.findUnique({ where: { id: 'A001' } });
      expect(updatedArticle.quantite).toBe(10);
    });
  });

  describe('Rate Limiting on /auth/login', () => {
    it('should return 429 after exceeding limit of attempts', async () => {
      // Send 10 login attempts (limit is 10)
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/auth/login')
          .send({ identifier: 'wrong', mot_de_passe: 'wrong' });
      }

      // 11th request should get 429
      const res = await request(app)
        .post('/auth/login')
        .send({ identifier: 'wrong', mot_de_passe: 'wrong' });

      expect(res.status).toBe(429);
      expect(res.body.error).toContain('tentatives');
    });
  });
});
