// services/mailService.js
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');

// --- Configuración del transportador de correo ---
// Usamos las variables de entorno para la API Key y el correo verificado
const options = {
  auth: {
    api_key: process.env.SENDGRID_API_KEY
  }
};

const mailer = nodemailer.createTransport(sgTransport(options));

/**
 * Función para enviar una alerta de máquina desconectada.
 * @param {object} machine - El objeto de la máquina que se desconectó.
 */
const sendMachineOfflineAlert = (machine) => {
  if (!process.env.ALERT_EMAIL_RECIPIENT) {
    console.error("No se ha configurado un destinatario para las alertas (ALERT_EMAIL_RECIPIENT).");
    return;
  }
  
  const email = {
    to: [process.env.ALERT_EMAIL_RECIPIENT], // El correo que recibirá la alerta
    from: 'alertas@vending-system.com', // Puedes usar el correo que verificaste en SendGrid
    subject: `Alerta Crítica: Máquina ${machine.machineId} se ha Desconectado`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #d9534f;">🚨 Alerta de Red Vending System</h2>
        <p>Hemos detectado que una de tus máquinas ha perdido la conexión.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">ID de Máquina:</td>
            <td style="padding: 8px;">${machine.machineId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Ubicación:</td>
            <td style="padding: 8px;">${machine.location}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Última Conexión:</td>
            <td style="padding: 8px;">${new Date(machine.lastHeartbeat).toLocaleString('es-MX')}</td>
          </tr>
        </table>
        <p style="margin-top: 25px;">
          <a 
            href="${process.env.FRONTEND_URL}/machines/${machine.machineId}" 
            style="background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px;"
          >
            Ver Detalles de la Máquina
          </a>
        </p>
      </div>
    `
  };

  mailer.sendMail(email, (err, res) => {
    if (err) {
      console.error('Error al enviar el email de alerta:', err);
    } else {
      console.log(`📧 Email de alerta para la máquina ${machine.machineId} enviado exitosamente.`);
    }
  });
};

module.exports = { sendMachineOfflineAlert };