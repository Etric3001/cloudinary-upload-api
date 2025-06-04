require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fileType = require('file-type');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const clamav = require('clamav.js');

const app = express();
const upload = multer();

app.use(cors());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Fonction de scan ClamAV (clamav-daemon doit tourner sur port 3310)
function scanBuffer(buffer) {
  return new Promise((resolve, reject) => {
    clamav.createScanner(3310, '127.0.0.1').scanBuffer(buffer, (err, malicious) => {
      if (err) return reject(err);
      if (malicious) return reject(new Error('Fichier infecté détecté !'));
      resolve();
    });
  });
}

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier envoyé' });
    }
    const buffer = req.file.buffer;

    // Vérification type MIME
    const type = await fileType.fromBuffer(buffer);
    if (!type || !['image/jpeg', 'image/png', 'image/webp'].includes(type.mime)) {
      return res.status(400).json({ error: 'Fichier non autorisé' });
    }

    // Scan antivirus
    await scanBuffer(buffer);

    // Upload Cloudinary en base64
    const base64Image = `data:${type.mime};base64,${buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(base64Image, { folder: 'uploads' });

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Erreur lors de l’envoi' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur en ligne sur le port ${PORT}`));
