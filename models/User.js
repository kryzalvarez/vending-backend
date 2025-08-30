// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'technician', 'sales'],
    default: 'technician'
  },
  // --- NUEVA SECCIÓN AÑADIDA ---
  notificationPreferences: {
    email: {
      machineOffline: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: false },
    }
    // En el futuro podríamos añadir: sms: { ... }, push: { ... }
  }
  // --- FIN DE LA NUEVA SECCIÓN ---
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;