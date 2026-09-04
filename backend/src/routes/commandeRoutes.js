const express = require("express");

const {
  createCommande,
  getCommandes,
  getCommandeById,
  receiveCommande,
} = require("../controllers/commandeController");

const { protect } = require("../middlewares/auth");
const requireRole = require("../middlewares/role");

const router = express.Router();

// Authentication
router.use(protect);

// Get all commandes
// All authenticated users
router.get("/", getCommandes);

// Get one commande
router.get("/:id", getCommandeById);

// Receive commande
router.put("/:id/receive", requireRole(["GL", "ADMIN"]), receiveCommande);

// Create commande
// GL + ADMIN
router.post("/", requireRole(["GL", "ADMIN"]), createCommande);

module.exports = router;
