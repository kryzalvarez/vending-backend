// models/Sale.js
const mongoose = require('mongoose');

// Este es un "sub-documento", define la estructura de cada item dentro de una venta.
const itemSchema = new mongoose.Schema({
    productId: { type: String, required: true }, // Podríamos referenciar al modelo Product, pero un String simple es más fácil para empezar.
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
}, { _id: false }); // No necesitamos un ID separado para cada item en la lista.

const saleSchema = new mongoose.Schema({
    vendingTransactionId: { type: String, required: true, unique: true, index: true },
    machineId: { type: String, required: true, index: true },
    items: [itemSchema],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled', 'refunded'],
        default: 'pending'
    },
    mpPreferenceId: { type: String },
    mpPaymentId: { type: String },
    paymentStatusDetail: { type: String }
}, { 
    timestamps: true // Esto añade automáticamente los campos createdAt y updatedAt
});

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;