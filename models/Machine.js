// models/Machine.js (Versión Corregida)
const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
    machineId: { type: String, required: true, unique: true },
    
    // --- CORRECCIÓN AQUÍ ---
    // Location ahora es un objeto con dos números, y todo el objeto es requerido.
    location: {
        type: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        },
        required: true
    },
    // -----------------------

    model: { type: String },
    status: { 
        type: String, 
        enum: ['online', 'offline', 'maintenance'], 
        default: 'offline' 
    },
    lastHeartbeat: { type: Date }
});

const Machine = mongoose.model('Machine', machineSchema);

module.exports = Machine;