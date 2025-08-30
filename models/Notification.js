// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // A quién le pertenece la notificación (opcional, para el futuro)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Sobre qué máquina es la notificación (opcional)
  machineId: {
    type: String,
    index: true,
  },
  // Tipo de notificación para poder filtrarlas o ponerles íconos
  type: {
    type: String,
    required: true,
    enum: ['MACHINE_OFFLINE', 'LOW_STOCK', 'SALE_SUCCESS', 'ERROR'],
  },
  // El mensaje que se mostrará
  message: {
    type: String,
    required: true,
  },
  // Para saber si el usuario ya la vio
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;