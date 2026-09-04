const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../config/db');
const { AppError } = require('../helpers/AppError');
const { validateManagerAssignment } = require('../services/userHierarchy');
const { logUserCreate, logUserUpdate, logUserDelete } = require('../services/userAuditService');

const createUserSchema = z.object({
  matricule: z.string().trim().min(1, "Le matricule est requis"),
  email: z.string().trim().toLowerCase().email("Format d'email invalide"),
  nom: z.string().trim().min(2, "Le nom doit comporter au moins 2 caractères"),
  mot_de_passe: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: z.enum(['ADMIN', 'MANAGER', 'GL', 'TL', 'SUPERVISEUR', 'DESIGNER', 'TECHNICIEN', 'TECHNICIENSTOCK', 'OPERATEUR']),
  statut: z.enum(['ACTIF', 'INACTIF']).optional(),
  managerId: z.string().nullable().optional(),
  phoneNumber: z.string().trim().optional().nullable(),
  hireDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
});

const updateUserSchema = z.object({
  matricule: z.string().trim().min(1, "Le matricule est requis").optional(),
  email: z.string().trim().toLowerCase().email("Format d'email invalide").optional(),
  nom: z.string().trim().min(2, "Le nom doit comporter au moins 2 caractères").optional(),
  mot_de_passe: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").optional().nullable(),
  role: z.enum(['ADMIN', 'MANAGER', 'GL', 'TL', 'SUPERVISEUR', 'DESIGNER', 'TECHNICIEN', 'TECHNICIENSTOCK', 'OPERATEUR']).optional(),
  statut: z.enum(['ACTIF', 'INACTIF']).optional(),
  managerId: z.string().nullable().optional(),
  phoneNumber: z.string().trim().optional().nullable(),
  hireDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
});

// @desc    Get all users
// @route   GET /users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        matricule: true,
        email: true,
        nom: true,
        role: true,
        statut: true,
        managerId: true,
        photoUrl: true,
        phoneNumber: true,
        hireDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Get organization tree data (users with managers)
// @route   GET /users/organization
// @access  Private
const getOrganizationData = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        matricule: true,
        email: true,
        nom: true,
        role: true,
        statut: true,
        managerId: true,
        photoUrl: true,
        department: true,
        phoneNumber: true,
        hireDate: true,
      },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all potential managers for assignment dropdowns
// @route   GET /users/team
// @access  Private (all authenticated roles)
const getTeamUsers = async (req, res, next) => {
  try {
    // Return all ACTIF users who could be a manager for any role
    // (ADMIN, MANAGER, GL, TL, SUPERVISEUR)
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER', 'GL', 'TL', 'SUPERVISEUR'] },
        statut: 'ACTIF',
      },
      select: {
        id: true,
        matricule: true,
        nom: true,
        role: true,
        managerId: true,
      },
      orderBy: { nom: 'asc' },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user
// @route   POST /users
// @access  Private/Admin
const createUser = async (req, res, next) => {
  try {
    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR');
    }

    const { matricule, email, nom, mot_de_passe, role, statut, managerId, phoneNumber, hireDate } = validation.data;

    // Validate manager if provided
    await validateManagerAssignment(null, managerId, role, prisma);

    // Check if matricule or email exists
    const userExists = await prisma.user.findFirst({
      where: {
        OR: [
          { matricule },
          { email }
        ]
      }
    });

    if (userExists) {
      throw new AppError("Un utilisateur avec ce matricule ou cet email existe déjà", 409, 'DUPLICATE_USER');
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const user = await prisma.user.create({
      data: {
        matricule,
        email,
        nom,
        mot_de_passe: hashedPassword,
        role,
        statut: statut || 'ACTIF',
        managerId: managerId || null,
        phoneNumber: phoneNumber || null,
        hireDate: hireDate || null,
        department: req.body.department || null,
        position: req.body.position || null,
      },
      select: {
        id: true,
        matricule: true,
        email: true,
        nom: true,
        role: true,
        statut: true,
        managerId: true,
        photoUrl: true,
        phoneNumber: true,
        hireDate: true,
      }
    });

    await logUserCreate(req.user.id, user.id, user, prisma);

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR');
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: id }
    });

    if (!existingUser) {
      throw new AppError("Utilisateur non trouvé", 404, 'USER_NOT_FOUND');
    }

    const updateData = { ...validation.data };
    
    // Explicit null assignments if empty strings are sent to clear them
    if (updateData.phoneNumber === "") updateData.phoneNumber = null;
    
    if (req.body.department !== undefined) updateData.department = req.body.department;
    if (req.body.position !== undefined) updateData.position = req.body.position;

    // Check unique constraints if matricule or email is being updated
    if (updateData.matricule && updateData.matricule !== existingUser.matricule) {
      const exists = await prisma.user.findUnique({ where: { matricule: updateData.matricule } });
      if (exists) throw new AppError("Matricule déjà utilisé", 409, 'DUPLICATE_MATRICULE');
    }

    if (updateData.email && updateData.email !== existingUser.email) {
      const exists = await prisma.user.findUnique({ where: { email: updateData.email } });
      if (exists) throw new AppError("Email déjà utilisé", 409, 'DUPLICATE_EMAIL');
    }

    if (updateData.mot_de_passe) {
      updateData.mot_de_passe = await bcrypt.hash(updateData.mot_de_passe, 10);
    } else {
      delete updateData.mot_de_passe; // Remove empty password fields
    }

    // Manager validation
    if (updateData.managerId !== undefined) {
      const newManagerId = updateData.managerId;
      const targetRole = updateData.role || existingUser.role;

      await validateManagerAssignment(existingUser.id, newManagerId, targetRole, prisma);
    }

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        matricule: true,
        email: true,
        nom: true,
        role: true,
        statut: true,
        managerId: true,
        photoUrl: true,
        phoneNumber: true,
        hireDate: true,
      }
    });

    await logUserUpdate(req.user.id, updatedUser.id, existingUser, updateData, prisma);

    res.json(updatedUser);
  } catch (error) {
    if (error.code === 'P2014' || (error.message && error.message.includes('violate the required relation'))) {
      return next(new AppError("Impossible de modifier cet utilisateur car il est lié à d'autres enregistrements (ex: le matricule est utilisé dans des planifications).", 400, "RELATION_VIOLATION"));
    }
    next(error);
  }
};

// @desc    Delete/Disable user
// @route   DELETE /users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id: id },
      include: { subordinates: true }
    });

    if (!existingUser) {
      throw new AppError("Utilisateur non trouvé", 404, 'USER_NOT_FOUND');
    }

    if (existingUser.id === req.user.id) {
      throw new AppError("Vous ne pouvez pas supprimer ou désactiver votre propre compte", 400, 'SELF_DELETE');
    }

    if (existingUser.subordinates && existingUser.subordinates.length > 0) {
      throw new AppError("Cet utilisateur a des subordonnés. Veuillez les réassigner avant de le supprimer.", 400, 'HAS_SUBORDINATES');
    }

    // Soft delete
    await prisma.user.update({
      where: { id: id },
      data: { statut: 'INACTIF' }
    });

    await logUserDelete(req.user.id, existingUser.id, existingUser, prisma);

    res.json({ message: "Utilisateur désactivé avec succès" });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload User Photo
// @route   POST /users/:id/photo
// @access  Private/Admin
const uploadUserPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      throw new AppError("Aucun fichier fourni", 400, 'NO_FILE');
    }
    
    const photoUrl = `/uploads/photos/${req.file.filename}`;
    
    const user = await prisma.user.update({
      where: { id: id },
      data: { photoUrl },
      select: { id: true, photoUrl: true }
    });
    
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user audit logs
// @route   GET /users/audit
// @access  Private/Admin
const getUserAuditLogs = async (req, res, next) => {
  try {
    const logs = await prisma.userAuditLog.findMany({
      include: {
        actor: { select: { nom: true, matricule: true } },
        user: { select: { nom: true, matricule: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to last 100 for performance
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getTeamUsers,
  getOrganizationData,
  createUser,
  updateUser,
  deleteUser,
  uploadUserPhoto,
  getUserAuditLogs
};
