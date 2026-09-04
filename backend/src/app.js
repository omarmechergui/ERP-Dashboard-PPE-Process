const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load env variables
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const fournisseurRoutes = require('./routes/fournisseurRoutes');
const stockRoutes = require('./routes/stockRoutes');
const bomRoutes = require('./routes/bomRoutes');
const entrepotRoutes = require('./routes/entrepotRoutes');
const planificationRoutes = require('./routes/planificationRoutes');
const panneauRoutes = require('./routes/panneauRoutes');
const khmRoutes = require('./routes/khmRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const commandeRoutes = require('./routes/commandeRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const organigrammeRoutes = require('./routes/organigrammeRoutes');
const formationCertificationRoutes = require('./routes/formationCertificationRoutes');

const errorHandler = require('./middlewares/error');

const app = express();

// Middlewares
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

// Serve static files
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/fournisseurs', fournisseurRoutes);
app.use('/stock', stockRoutes);
app.use('/bom', bomRoutes);
app.use('/entrepots', entrepotRoutes);
app.use('/planifications', planificationRoutes);
app.use('/panneaux', panneauRoutes);
app.use('/khm', khmRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/reservations', reservationRoutes);
app.use('/commandes', commandeRoutes);
app.use('/maintenance', maintenanceRoutes);
app.use('/organigrammes', organigrammeRoutes);
app.use('/certification', formationCertificationRoutes);

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling
app.use(errorHandler);

module.exports = app;
