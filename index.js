// index.js (Código Completo con Tarea Programada "Vigilante")
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const cors = require('cors');
const cron = require('node-cron'); // Importamos node-cron

// --- IMPORTAR MODELOS ---
const Machine = require('./models/Machine');
const Product = require('./models/Product');
const Inventory = require('./models/Inventory');
const Sale = require('./models/Sale');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURACIÓN DE CORS ---
// Usamos la variable de entorno para mayor seguridad en producción
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
// --- FIN DE CONFIGURACIÓN DE CORS ---

app.use(express.json());

// --- Configuración del cliente de Mercado Pago ---
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
const preferenceClient = new Preference(client);
const paymentClient = new Payment(client);

// --- Función de Conexión a la Base de Datos ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Conectado...');
  } catch (err) {
    console.error('❌ Error de conexión a MongoDB:', err.message);
    process.exit(1);
  }
};

// --- ENDPOINTS DE LA API ---
app.get('/', (req, res) => {
  res.send('API del Vending System funcionando!');
});

// --- ENDPOINTS PARA MÁQUINAS ---
app.post('/api/machines', async (req, res) => {
  try {
    const newMachine = new Machine({
      machineId: req.body.machineId,
      location: req.body.location,
      model: req.body.model,
    });
    const machine = await newMachine.save();
    res.status(201).json(machine);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

app.get('/api/machines', async (req, res) => {
  try {
    const machines = await Machine.find();
    res.json(machines);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

app.patch('/api/machines/:machineId/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedMachine = await Machine.findOneAndUpdate(
            { machineId: req.params.machineId },
            { 
                status: status,
                lastHeartbeat: new Date()
            },
            { new: true, upsert: true }
        );
        res.json(updatedMachine);
    } catch (err) {
        console.error("Error en heartbeat:", err.message);
        res.status(500).send('Error en el servidor');
    }
});

// --- ENDPOINTS PARA PRODUCTOS ---
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product({
      sku: req.body.sku,
      name: req.body.name,
      description: req.body.description,
    });
    const product = await newProduct.save();
    res.status(201).json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// --- ENDPOINTS PARA INVENTARIO ---
app.post('/api/inventory', async (req, res) => {
  try {
    const { machineId, channelId, productId, quantity, price } = req.body;
    let inventoryItem = await Inventory.findOne({ machineId, channelId });
    if (inventoryItem) {
      inventoryItem.productId = productId;
      inventoryItem.quantity = quantity;
      inventoryItem.price = price;
    } else {
      inventoryItem = new Inventory({ machineId, channelId, productId, quantity, price });
    }
    await inventoryItem.save();
    res.status(201).json(inventoryItem);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

app.get('/api/machines/:machineId/inventory', async (req, res) => {
  try {
    const inventory = await Inventory.find({ machineId: req.params.machineId }).populate('productId');
    if (!inventory) {
      return res.status(404).json({ msg: 'Inventario no encontrado para esta máquina' });
    }
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

app.patch('/api/inventory/:id', async (req, res) => {
  try {
    const { quantity, price } = req.body;
    const inventoryItem = await Inventory.findById(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({ msg: 'Item de inventario no encontrado' });
    }
    if (quantity !== undefined) {
      inventoryItem.quantity = quantity;
    }
    if (price !== undefined) {
      inventoryItem.price = price;
    }
    await inventoryItem.save();
    res.json(inventoryItem);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const inventoryItem = await Inventory.findByIdAndDelete(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({ msg: 'Item de inventario no encontrado' });
    }
    res.json({ msg: 'Item de inventario eliminado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// --- ENDPOINTS PARA VENTAS Y PAGOS ---
app.post('/api/sales/create-payment', async (req, res) => {
  try {
    const { machine_id, items, vending_transaction_id } = req.body;
    const notification_url = `${process.env.BACKEND_URL}/api/sales/webhook`;
    console.log("URL de Notificación que se enviará a MP:", notification_url);
    const preferenceBody = {
      items: items.map(item => ({
        title: item.name,
        description: item.description || `Producto de ${machine_id}`,
        quantity: Number(item.quantity),
        currency_id: "MXN",
        unit_price: Number(item.price)
      })),
      external_reference: vending_transaction_id,
      notification_url: notification_url,
    };
    const preference = await preferenceClient.create({ body: preferenceBody });
    const newSale = new Sale({
      vendingTransactionId: vending_transaction_id,
      machineId: machine_id,
      items: items,
      status: 'pending',
      mpPreferenceId: preference.id,
    });
    await newSale.save();
    console.log(`Venta ${vending_transaction_id} creada como pendiente en la DB.`);
    res.status(201).json({
      vending_transaction_id: vending_transaction_id,
      mp_preference_id: preference.id,
      init_point: preference.init_point,
    });
  } catch (error) {
    console.error("Error al crear la preferencia de pago:", error);
    res.status(500).json({ error: "No se pudo crear la preferencia de pago." });
  }
});

app.get('/api/sales/status/:vendingId', async (req, res) => {
  try {
    const sale = await Sale.findOne({ vendingTransactionId: req.params.vendingId });
    if (!sale) {
      return res.status(404).json({ status: 'not_found', message: 'Transacción no encontrada.' });
    }
    res.json({
      vending_transaction_id: sale.vendingTransactionId,
      status: sale.status,
      machine_id: sale.machineId,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

app.post('/api/sales/webhook', async (req, res) => {
  console.log("--- INICIO WEBHOOK RECIBIDO ---");
  console.log("Query:", req.query);
  console.log("Body:", req.body);
  const paymentId = req.body.data?.id;
  if (req.body.type === 'payment' && paymentId) {
    try {
      const payment = await paymentClient.get({ id: paymentId });
      const vendingTxnId = payment.external_reference;
      const paymentStatus = payment.status;
      console.log(`Webhook: Status del pago ${paymentId} es '${paymentStatus}'. VendingTxnId: ${vendingTxnId}`);
      if (vendingTxnId) {
        const updatedSale = await Sale.findOneAndUpdate(
          { vendingTransactionId: vendingTxnId },
          {
            status: paymentStatus,
            mpPaymentId: paymentId,
            paymentStatusDetail: payment.status_detail
          },
          { new: true }
        );
        console.log(`Venta ${vendingTxnId} actualizada a estado '${paymentStatus}' en la DB.`);
        if (paymentStatus === 'approved') {
          console.log(`🚀 ¡PAGO APROBADO! Aquí iría la lógica para notificar a la máquina que dispense el producto.`);
        }
      }
    } catch (error) {
      console.error("Error procesando webhook:", error);
    }
  }
  res.sendStatus(200);
  console.log("--- FIN WEBHOOK ---");
});


// --- CÓDIGO MODIFICADO ---
app.get('/api/sales', async (req, res) => {
  try {
    const { machineId } = req.query; // Obtenemos el machineId de la URL (ej: ?machineId=VM001)

    let filter = {}; // Creamos un objeto de filtro vacío

    if (machineId) {
      filter.machineId = machineId; // Si nos pasan un machineId, lo añadimos al filtro
    }

    const sales = await Sale.find(filter).sort({ createdAt: -1 });
    res.json(sales);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});
// --- FIN DEL CÓDIGO MODIFICADO ---


// --- TAREA PROGRAMADA (VIGILANTE) ---
const checkMachineStatuses = async () => {
    console.log(`⏰ Ejecutando tarea del vigilante: Verificando máquinas inactivas...`);
    const TOLERANCE_MINUTES = 7;
    const cutoffTime = new Date(Date.now() - TOLERANCE_MINUTES * 60 * 1000);

    try {
        const result = await Machine.updateMany(
            { 
                status: 'online', 
                lastHeartbeat: { $lt: cutoffTime } // $lt significa "less than" (menor que)
            },
            { $set: { status: 'offline' } }
        );

        if (result.modifiedCount > 0) {
            console.log(`🚨 Vigilante: ${result.modifiedCount} máquina(s) marcada(s) como offline.`);
        } else {
            console.log(`✅ Vigilante: Todas las máquinas online están reportando correctamente.`);
        }
    } catch (error) {
        console.error("Error en la tarea del vigilante:", error);
    }
};

cron.schedule('*/5 * * * *', checkMachineStatuses);

// --- Iniciar Servidor ---
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    console.log("🕰️  Tarea del vigilante programada para ejecutarse cada 5 minutos.");
  });
});
