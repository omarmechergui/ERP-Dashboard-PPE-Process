const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../config/db');

const loginSchema = z.object({
  identifier: z.string().min(1, "L'email ou le matricule est requis"), // can be email or matricule
  mot_de_passe: z.string().min(1, "Le mot de passe est requis"),
});

// @desc    Auth user & get token
// @route   POST /auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { identifier, mot_de_passe } = validation.data;

    // Search by email or matricule
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { matricule: identifier },
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    if (user.statut === 'INACTIF') {
      return res.status(403).json({ error: "Compte inactif. Contactez l'administrateur." });
    }

    // Check password
    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isMatch) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, matricule: user.matricule, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        matricule: user.matricule,
        email: user.email,
        nom: user.nom,
        role: user.role,
        statut: user.statut
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /auth/register
// @access  Public
const register = async (req, res, next) => {
  try {

    const registerSchema = z.object({
      nom: z.string().min(1, 'Le nom est requis'),
      email: z.string().email('Email invalide'),
      matricule: z.string().min(1, 'Le matricule est requis'),
      mot_de_passe: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
      role: z.string().optional().default('OPERATEUR'),
    });

    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { nom, email, matricule, mot_de_passe, role } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { matricule },
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email ou matricule existe déjà' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mot_de_passe, salt);

    const user = await prisma.user.create({
      data: {
        nom,
        email,
        matricule,
        mot_de_passe: hashedPassword,
        role: role || 'OPERATEUR',
        statut: 'ACTIF',
      },
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        matricule: user.matricule,
        email: user.email,
        nom: user.nom,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        matricule: req.user.matricule,
        email: req.user.email,
        nom: req.user.nom,
        role: req.user.role,
        statut: req.user.statut
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
  register,
};
