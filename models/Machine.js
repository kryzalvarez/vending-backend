// models/Machine.js
const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
    machineId: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    model: { type: String },
    status: { 
        type: String, 
        enum: ['online', 'offline', 'maintenance'], 
        default: 'offline' 
    },
    lastHeartbeat: { type: Date } // <-- AÑADE ESTA LÍNEA
});

const Machine = mongoose.model('Machine', machineSchema);

module.exports = Machine;