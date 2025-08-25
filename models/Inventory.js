// models/Inventory.js
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    machineId: { type: String, required: true, index: true },
    channelId: { type: Number, required: true },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Esto crea una relación con nuestro modelo Product
        required: true
    },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 }
}, { timestamps: true });

// Para asegurar que no haya dos productos en el mismo canal de la misma máquina
inventorySchema.index({ machineId: 1, channelId: 1 }, { unique: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;