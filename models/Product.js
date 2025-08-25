// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    sku: { type: String, required: true, unique: true }, // SKU: Stock Keeping Unit
    name: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;