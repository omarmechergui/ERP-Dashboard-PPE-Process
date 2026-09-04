const prisma = require('../config/db');
const { isTechnicianRole, TECHNICIEN_ROLES } = require('../helpers/stockHelpers');
const crypto = require('crypto');

// Helper to determine the next level and badge
const getNextLevelInfo = (currentLevel) => {
  switch (currentLevel) {
    case 'Débutant': return { niveau: 'Niveau 1', badge: 'BRONZE' };
    case 'Niveau 1': return { niveau: 'Niveau 2', badge: 'SILVER' };
    case 'Niveau 2': return { niveau: 'Niveau 3', badge: 'GOLD' };
    case 'Niveau 3': return { niveau: 'Expert', badge: 'EXPERT' };
    case 'Expert': return { niveau: 'Expert', badge: 'EXPERT' }; // max level
    default: return { niveau: 'Niveau 1', badge: 'BRONZE' };
  }
};

const getDashboardInfo = async (req, res, next) => {
  try {
    const { role, id } = req.user;

    let techFilter = { role: { in: ['TECHNICIEN', 'TECHNICIENSTOCK'] } };
    if (role === 'SUPERVISEUR') {
      techFilter.managerId = id;
    }

    const techniciens = await prisma.user.findMany({ where: techFilter });
    const technicienIds = techniciens.map(t => t.id);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const tests = await prisma.formationTest.findMany({
      where: { technicienId: { in: technicienIds } }
    });

    const testsAujourdHui = tests.filter(t => t.dateTest >= todayStart && t.dateTest <= todayEnd && t.resultat !== 'REUSSI' && t.resultat !== 'ECHOUE').length;
    const testsAVenir = tests.filter(t => t.dateTest > todayEnd && t.resultat === 'A_VENIR').length;
    const testsReussis = tests.filter(t => t.resultat === 'REUSSI').length;
    const testsEchoues = tests.filter(t => t.resultat === 'ECHOUE').length;

    const enFormation = techniciens.filter(t => t.currentNiveau === 'Débutant').length;
    const niveau1 = techniciens.filter(t => t.currentNiveau === 'Niveau 1').length;
    const niveau2 = techniciens.filter(t => t.currentNiveau === 'Niveau 2').length;
    const niveau3 = techniciens.filter(t => t.currentNiveau === 'Niveau 3').length;
    const experts = techniciens.filter(t => t.currentNiveau === 'Expert').length;

    // Get all certifications for dashboard stats
    const certifications = await prisma.certification.findMany({
      where: { technicienId: { in: technicienIds } }
    });

    const now = new Date();
    const certificationsValides = certifications.filter(c => c.statut === 'VALIDE' && (!c.dateExpiration || c.dateExpiration > now)).length;
    const certificationsExpirantBientot = certifications.filter(c => c.statut === 'EXPIRANT_BIENTOT' || (c.dateExpiration && c.statut === 'VALIDE' && (c.dateExpiration.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 90)).length;
    const certificationsExpirees = certifications.filter(c => c.statut === 'EXPIREE' || (c.dateExpiration && c.dateExpiration < now)).length;

    res.json({
      total: techniciens.length,
      testsAujourdHui,
      testsAVenir,
      testsReussis,
      testsEchoues,
      enFormation,
      niveau1,
      niveau2,
      niveau3,
      experts,
      certificationsValides,
      certificationsExpirantBientot,
      certificationsExpirees
    });
  } catch (error) {
    next(error);
  }
};

const getTechniciensList = async (req, res, next) => {
  try {
    const { role, id } = req.user;

    let techFilter = { role: { in: ['TECHNICIEN', 'TECHNICIENSTOCK'] } };
    if (role === 'SUPERVISEUR') {
      techFilter.managerId = id;
    } else if (isTechnicianRole(role)) {
      techFilter.id = id;
    }

    const techniciens = await prisma.user.findMany({
      where: techFilter,
      include: {
        badges: true,
        formationTests: {
          orderBy: { dateTest: 'desc' },
          take: 1
        }
      },
      orderBy: { nom: 'asc' }
    });

    res.json(techniciens);
  } catch (error) {
    next(error);
  }
};

const getTechnicienDetails = async (req, res, next) => {
  try {
    const { techId } = req.params;

    const technicien = await prisma.user.findUnique({
      where: { id: techId },
      include: {
        badges: { orderBy: { dateObtention: 'desc' } },
        formationTests: { 
          orderBy: { dateTest: 'desc' },
          include: { superviseur: { select: { nom: true } } }
        },
        formation_history: { orderBy: { timestamp: 'desc' } },
        skills: true,
        certifications: { orderBy: { dateObtention: 'desc' } },
        formations: { orderBy: { startDate: 'desc' } }
      }
    });

    if (!technicien) return res.status(404).json({ error: "Technicien non trouvé" });
    res.json(technicien);
  } catch (error) {
    next(error);
  }
};

const getTemplates = async (req, res, next) => {
  try {
    const templates = await prisma.formationChecklistTemplate.findMany({
      where: { active: true },
      include: {
        items: { orderBy: { order: 'asc' } }
      },
      orderBy: { niveau: 'asc' }
    });
    res.json(templates);
  } catch (error) {
    next(error);
  }
};

const importTemplates = async (req, res, next) => {
  try {
    const { rows, confirm } = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: "Format de données invalide. Un tableau 'rows' est attendu." });
    }

    const allowedLevels = ['Niveau 1', 'Niveau 2', 'Niveau 3', 'Expert'];
    let validRowsCount = 0;
    let errorsCount = 0;
    const validatedRows = [];
    const statsByLevel = { 'Niveau 1': 0, 'Niveau 2': 0, 'Niveau 3': 0, 'Expert': 0 };

    // 1. Validation Phase
    rows.forEach((row, index) => {
      let isRowValid = true;
      const errors = [];
      const rowNum = index + 1;

      const niveau = row['Niveau']?.toString().trim();
      if (!allowedLevels.includes(niveau)) {
        isRowValid = false;
        errors.push(`Niveau inconnu ou manquant: '${niveau}'`);
      }

      const categorie = row['Catégorie']?.toString().trim();
      if (!categorie) {
        isRowValid = false;
        errors.push("Catégorie manquante");
      }

      const question = row['Question']?.toString().trim();
      if (!question) {
        isRowValid = false;
        errors.push("Question manquante");
      }

      let points = Number(row['Points']);
      if (isNaN(points) || points <= 0) {
        points = 1;
      }

      let required = true;
      const rawReq = row['Required']?.toString().toLowerCase().trim();
      if (rawReq === 'non' || rawReq === 'no' || rawReq === 'false' || rawReq === '0') {
        required = false;
      }

      // Parse Réponse correcte
      const rawReponse = row['Réponse correcte']?.toString().toLowerCase().trim();
      let isConforme = null;
      
      if (!rawReponse) {
        isRowValid = false;
        errors.push("La réponse correcte est obligatoire.");
      } else {
        const trueValues = ['conforme', 'oui', 'yes', 'true', '1'];
        const falseValues = ['non_conforme', 'non conforme', 'non', 'no', 'false', '0'];
        
        if (trueValues.includes(rawReponse)) {
          isConforme = true;
        } else if (falseValues.includes(rawReponse)) {
          isConforme = false;
        } else {
          isRowValid = false;
          errors.push("Réponse correcte invalide. Valeurs acceptées: CONFORME, NON_CONFORME, Oui, Non, True, False, 1, 0.");
        }
      }

      let ordre = Number(row['Ordre']);
      if (isNaN(ordre)) {
        ordre = 0; // will be auto-assigned later if needed
      }

      if (isRowValid) {
        validRowsCount++;
        statsByLevel[niveau]++;
        validatedRows.push({
          niveau,
          category: categorie,
          question,
          description: row['Description']?.toString().trim() || null,
          points,
          required,
          isConforme,
          order: ordre,
          originalIndex: rowNum
        });
      } else {
        errorsCount++;
      }
      
      // Update the row for preview
      if (isConforme !== null) {
        row['isConforme'] = isConforme;
      }

      row._valid = isRowValid;
      row._errors = errors;
    });

    if (!confirm) {
      return res.json({
        total: rows.length,
        valid: validRowsCount,
        errors: errorsCount,
        breakdown: statsByLevel,
        previewRows: rows
      });
    }

    // 2. Execution Phase (Transaction)
    if (errorsCount > 0) {
      return res.status(400).json({ error: "Impossible d'importer: le fichier contient des erreurs." });
    }

    // Group valid rows by level
    const byLevel = {};
    validatedRows.forEach(r => {
      if (!byLevel[r.niveau]) byLevel[r.niveau] = [];
      // Assign auto order if missing
      if (r.order === 0) {
        r.order = byLevel[r.niveau].length + 1;
      }
      byLevel[r.niveau].push(r);
    });

    let templatesCreated = 0;
    let templatesUpdated = 0;
    let totalImported = 0;

    await prisma.$transaction(async (tx) => {
      for (const niveau of Object.keys(byLevel)) {
        const itemsToInsert = byLevel[niveau];

        const existingTemplate = await tx.formationChecklistTemplate.findUnique({
          where: { niveau }
        });

        let templateId;
        if (existingTemplate) {
          templatesUpdated++;
          templateId = existingTemplate.id;
          // Clear existing items for this template
          await tx.formationChecklistItem.deleteMany({
            where: { templateId }
          });
        } else {
          templatesCreated++;
          const newTemplate = await tx.formationChecklistTemplate.create({
            data: {
              niveau,
              title: `Checklist - ${niveau}`,
              active: true
            }
          });
          templateId = newTemplate.id;
        }

        // Insert new items using createMany for better performance
        const dataToInsert = itemsToInsert.map(item => ({
          templateId,
          category: item.category,
          question: item.question,
          description: item.description,
          points: item.points,
          required: item.required,
          isConforme: item.isConforme,
          order: item.order
        }));
        
        if (dataToInsert.length > 0) {
          await tx.formationChecklistItem.createMany({
            data: dataToInsert
          });
          totalImported += dataToInsert.length;
        }
      }
    }, {
      maxWait: 5000,
      timeout: 30000 // Increase timeout to 30s
    });

    res.json({
      success: true,
      templatesCreated,
      templatesUpdated,
      totalImported,
      breakdown: statsByLevel
    });

  } catch (error) {
    next(error);
  }
};

const scheduleTest = async (req, res, next) => {
  try {
    const { techId, dateTest } = req.body;
    const superviseurId = req.user.id;

    const technicien = await prisma.user.findUnique({ where: { id: techId } });
    if (!technicien) return res.status(404).json({ error: "Technicien non trouvé" });

    // Verify supervisor-technician relationship
    if (req.user.role === 'SUPERVISEUR') {
      if (technicien.managerId !== req.user.id) {
        return res.status(403).json({ 
          error: "Ce technicien n'est pas sous votre responsabilité." 
        });
      }
    }
    
    if (!isTechnicianRole(technicien.role)) {
       return res.status(400).json({ error: "L'utilisateur spécifié n'est pas un technicien." });
    }

    if (technicien.currentNiveau === 'Expert') {
      return res.status(400).json({ error: "Ce technicien a déjà atteint le niveau maximum (Expert)." });
    }

    const nextInfo = getNextLevelInfo(technicien.currentNiveau || 'Débutant');

    // Prevent scheduling if already an A_VENIR test exists
    const existingTest = await prisma.formationTest.findFirst({
      where: {
        technicienId: technicien.id,
        resultat: 'A_VENIR'
      }
    });

    if (existingTest) {
      return res.status(400).json({ error: "Ce technicien a déjà un test planifié en attente." });
    }

    // Load the checklist template for the target level
    const template = await prisma.formationChecklistTemplate.findUnique({
      where: { niveau: nextInfo.niveau },
      include: {
        items: { 
          where: { active: true },
          orderBy: { order: 'asc' } 
        }
      }
    });

    if (!template || !template.active) {
      return res.status(400).json({ 
        error: `Aucun modèle de checklist actif trouvé pour le niveau "${nextInfo.niveau}". Veuillez d'abord créer un modèle.` 
      });
    }

    if (template.items.length === 0) {
      return res.status(400).json({ 
        error: `Le modèle de checklist pour "${nextInfo.niveau}" ne contient aucun élément.` 
      });
    }

    // Create the test
    const test = await prisma.formationTest.create({
      data: {
        technicienId: technicien.id,
        superviseurId: superviseurId,
        niveauEvalue: nextInfo.niveau,
        dateTest: new Date(dateTest),
        resultat: 'A_VENIR',
        formationId: req.body.formationId || null
      }
    });

    // Snapshot: Copy all template items into FormationTestItem for this specific test
    for (const item of template.items) {
      await prisma.formationTestItem.create({
        data: {
          formationTestId: test.id,
          category: item.category,
          question: item.question,
          description: item.description,
          points: item.points,
          required: item.required,
          order: item.order,
          correctAnswer: item.isConforme
        }
      });
    }

    // Return the test with its items
    const fullTest = await prisma.formationTest.findUnique({
      where: { id: test.id },
      include: {
        items: true,
        technicien: { select: { nom: true, matricule: true, currentNiveau: true } },
        superviseur: { select: { nom: true } }
      }
    });

    res.status(201).json(fullTest);
  } catch (error) {
    next(error);
  }
};

const getTestDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await prisma.formationTest.findUnique({
      where: { id: id },
      include: {
        items: { orderBy: { id: 'asc' } },
        technicien: { select: { nom: true, matricule: true, currentNiveau: true, managerId: true } },
        superviseur: { select: { nom: true } }
      }
    });
    if (!test) return res.status(404).json({ error: "Test non trouvé" });
    res.json(test);
  } catch (error) {
    next(error);
  }
};

const submitTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // array of { id, isConforme }

    const test = await prisma.formationTest.findUnique({
      where: { id: id },
      include: { 
        technicien: true,
        items: true
      }
    });

    if (!test) return res.status(404).json({ error: "Test non trouvé" });
    if (test.technicienId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Seul le technicien assigné peut soumettre son test." });
    }
    
    // Check for A_VENIR or other states. Prevent duplicate submissions.
    if (test.resultat !== 'A_VENIR') {
      return res.status(400).json({ error: "Ce test est déjà soumis ou ne peut pas être soumis." });
    }
    
    // Verify required items
    const requiredItems = test.items.filter(i => i.required);
    const submittedIds = new Set(items.map(i => i.id));
    const missingRequired = requiredItems.filter(i => !submittedIds.has(i.id));
    if (missingRequired.length > 0) {
      return res.status(400).json({ error: "Toutes les questions requises doivent être répondues." });
    }

    let totalPossiblePoints = 0;
    let obtainedPoints = 0;

    // Calculate score using all required items
    for (const dbItem of test.items) {
      if (dbItem.required) {
        totalPossiblePoints += dbItem.points;
        const submittedItem = items.find(i => i.id === dbItem.id);
        if (submittedItem && submittedItem.isConforme === dbItem.correctAnswer) {
          obtainedPoints += dbItem.points;
        }
      }
    }

    let score = 0;
    if (totalPossiblePoints > 0) {
      score = (obtainedPoints / totalPossiblePoints) * 100;
    }
    const passed = score >= 80;
    
    let updateData = {
      score,
      resultat: passed ? 'REUSSI' : 'ECHOUE',
    };

    const updatedTest = await prisma.$transaction(async (tx) => {
      await Promise.all(items.map(async (submittedItem) => {
        const dbItem = test.items.find(i => i.id === submittedItem.id);
        if (!dbItem) return;

        return tx.formationTestItem.update({
          where: { id: submittedItem.id },
          data: { isConforme: submittedItem.isConforme }
        });
      }));

      if (passed) {
         updateData.promotion = true;
         updateData.previousNiveau = test.technicien.currentNiveau;
         
         const nextInfo = getNextLevelInfo(test.technicien.currentNiveau);
         updateData.newNiveau = nextInfo.niveau;

         let uniqueBadgeId;
         let isUnique = false;
         while (!isUnique) {
           const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
           uniqueBadgeId = `BDG-${new Date().getFullYear()}-${rand}`;
           const existing = await tx.badge.findUnique({ where: { badgeId: uniqueBadgeId } });
           if (!existing) isUnique = true;
         }

         const nextYear = new Date();
         nextYear.setFullYear(nextYear.getFullYear() + 1);

         const dateExpiration = new Date();
         dateExpiration.setFullYear(dateExpiration.getFullYear() + 2);

         const certification = await tx.certification.create({
           data: {
             technicienId: test.technicien.id,
             testId: test.id,
             formationId: test.formationId,
             nom: `Certification ${nextInfo.niveau}`,
             type: nextInfo.niveau,
             dateExpiration: dateExpiration,
             statut: 'VALIDE'
           }
         });

         await tx.badge.create({
           data: {
             badgeId: uniqueBadgeId,
             technicienId: test.technicien.id,
             niveau: nextInfo.niveau,
             badgeType: nextInfo.badge,
             testId: test.id,
             certificationId: certification.id
           }
         });

         await tx.user.update({
           where: { id: test.technicien.id },
           data: {
             currentNiveau: nextInfo.niveau,
             nextTestDate: nextYear
           }
         });
      }

      return await tx.formationTest.update({
        where: { id: id },
        data: updateData
      });
    }, {
      maxWait: 5000,
      timeout: 20000
    });

    res.json(updatedTest);
  } catch (error) {
    next(error);
  }
};

const getBadge = async (req, res, next) => {
  try {
    const { badgeId } = req.params;
    const badge = await prisma.badge.findUnique({
      where: { badgeId },
      include: {
        technicien: { select: { nom: true, matricule: true } }
      }
    });

    if (!badge) return res.status(404).json({ error: "Badge invalide ou non trouvé" });
    res.json(badge);
  } catch (error) {
    next(error);
  }
};

const deleteTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await prisma.formationTest.findUnique({ where: { id: id } });
    if (!test) return res.status(404).json({ error: "Test non trouvé" });

    await prisma.formationTest.delete({ where: { id: id } });
    res.json({ success: true, message: "Test supprimé avec succès." });
  } catch (error) {
    next(error);
  }
};

const deleteBadge = async (req, res, next) => {
  try {
    const { badgeId } = req.params;
    const badge = await prisma.badge.findUnique({ where: { badgeId } });
    if (!badge) return res.status(404).json({ error: "Badge non trouvé" });

    await prisma.badge.delete({ where: { badgeId } });
    res.json({ success: true, message: "Badge supprimé avec succès." });
  } catch (error) {
    next(error);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    const { niveau } = req.params;
    
    const template = await prisma.formationChecklistTemplate.findUnique({ where: { niveau } });
    if (!template) return res.status(404).json({ error: "Modèle non trouvé" });

    const testsUsingTemplate = await prisma.formationTest.findFirst({
      where: { niveauEvalue: niveau }
    });

    if (testsUsingTemplate) {
      await prisma.formationChecklistTemplate.update({
        where: { niveau },
        data: { active: false }
      });
      return res.json({ success: true, message: "Modèle archivé (déjà utilisé dans des tests)." });
    } else {
      await prisma.formationChecklistTemplate.delete({ where: { niveau } });
      return res.json({ success: true, message: "Modèle supprimé avec succès." });
    }
  } catch (error) {
    next(error);
  }
};

const getCertifications = async (req, res, next) => {
  try {
    const { techId } = req.params;
    const certifications = await prisma.certification.findMany({
      where: { technicienId: techId },
      orderBy: { dateObtention: 'desc' }
    });
    res.json(certifications);
  } catch (error) {
    next(error);
  }
};

const getFormationsForCertification = async (req, res, next) => {
  try {
    const { techId } = req.params;
    const formations = await prisma.formation.findMany({
      where: { technicienId: techId },
      orderBy: { startDate: 'desc' }
    });
    res.json(formations);
  } catch (error) {
    next(error);
  }
};

// --- QUESTION BANK MANAGEMENT (ADMIN ONLY) ---

const getQuestions = async (req, res, next) => {
  try {
    const questions = await prisma.formationChecklistItem.findMany({
      include: {
        template: { select: { niveau: true } }
      },
      orderBy: [
        { template: { niveau: 'asc' } },
        { order: 'asc' }
      ]
    });
    res.json(questions);
  } catch (error) {
    next(error);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const { niveau, category, question, description, points, required, isConforme } = req.body;
    
    // Find or create template if needed (though usually template must exist)
    const template = await prisma.formationChecklistTemplate.findUnique({
      where: { niveau }
    });

    if (!template) {
      return res.status(404).json({ error: "Le modèle (Niveau) n'existe pas." });
    }

    const newQuestion = await prisma.formationChecklistItem.create({
      data: {
        templateId: template.id,
        category,
        question,
        description,
        points: parseInt(points) || 1,
        required: required !== undefined ? required : true,
        isConforme: isConforme !== undefined ? isConforme : true,
        active: true,
        order: 999 // Add at the end
      }
    });

    res.status(201).json(newQuestion);
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, question, description, points, required, niveau, isConforme } = req.body;

    const existing = await prisma.formationChecklistItem.findUnique({ where: { id: id } });
    if (!existing) return res.status(404).json({ error: "Question non trouvée." });

    let templateId = existing.templateId;
    if (niveau) {
      const template = await prisma.formationChecklistTemplate.findUnique({ where: { niveau } });
      if (template) templateId = template.id;
    }

    const updated = await prisma.formationChecklistItem.update({
      where: { id: id },
      data: {
        templateId,
        category,
        question,
        description,
        points: points !== undefined ? parseInt(points) : undefined,
        required,
        isConforme
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const toggleQuestionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const updated = await prisma.formationChecklistItem.update({
      where: { id: id },
      data: { active }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.formationChecklistItem.delete({
      where: { id: id }
    });
    res.json({ success: true, message: "Question supprimée avec succès." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardInfo,
  getTechniciensList,
  getTechnicienDetails,
  getTemplates,
  importTemplates,
  scheduleTest,
  getTestDetails,
  submitTest,
  getBadge,
  deleteTest,
  deleteBadge,
  deleteTemplate,
  getCertifications,
  getFormationsForCertification,
  getQuestions,
  createQuestion,
  updateQuestion,
  toggleQuestionStatus,
  deleteQuestion
};
