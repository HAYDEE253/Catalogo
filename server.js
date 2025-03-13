const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const app = express();
const port = 3000;
const fs = require('fs');
const uploadPath = path.join(__dirname, 'public', 'uploads');

// Si la carpeta no existe, la crea
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Configuración de multer para almacenar las imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'public', 'uploads'); // RUTA CORRECTA
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Configuración de middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Asegurar que se pueda leer datos de formularios
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));


// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/BD', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.log('Error al conectar con MongoDB:', err));

// Esquema de la joya en MongoDB
const joyaSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  precio: Number,
  material: String,
  en_stock: Boolean,
  categoria: String,
  imagen: String, // Guardamos la URL de la imagen
});

const Joya = mongoose.model('Joya', joyaSchema);

// Ruta para obtener todas las joyas
app.get('/joyas', async (req, res) => {
  try {
    const joyas = await Joya.find();
    res.json(joyas);
  } catch (err) {
    console.log('Error al obtener las joyas:', err);
    res.status(500).send('Error al obtener las joyas');
  }
});

// Ruta para agregar una nueva joya con imagen (sin autenticación)
app.post('/joyas', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, descripcion, precio, material, en_stock, categoria } = req.body;
    const imagenUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!nombre || !descripcion || !precio || !material || !categoria) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const nuevaJoya = new Joya({
      nombre,
      descripcion,
      precio,
      material,
      en_stock: en_stock === 'true', // Convertir string a booleano
      categoria,
      imagen: imagenUrl,
    });

    const result = await nuevaJoya.save();
    console.log('Joya agregada:', result);
    res.status(201).json({ message: 'Joya agregada con éxito', joya: result });
  } catch (err) {
    console.log('Error al agregar la joya:', err);
    res.status(500).json({ message: 'Error al agregar la joya' });
  }
});

// Ruta para eliminar una joya
app.delete('/joyas/:id', async (req, res) => {
  try {
    const result = await Joya.findByIdAndDelete(req.params.id);
    if (result) {
      res.status(200).json({ message: 'Joya eliminada con éxito' });
    } else {
      res.status(404).json({ message: 'Joya no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la joya', error });
  }
});

// Ruta para actualizar una joya
app.put('/joyas/:id', async (req, res) => {
  try {
    const { nombre, descripcion, precio, material, en_stock, categoria } = req.body;

    const result = await Joya.findByIdAndUpdate(
      req.params.id,
      { nombre, descripcion, precio, material, en_stock: en_stock === 'true', categoria },
      { new: true }
    );

    if (result) {
      res.status(200).json({ message: 'Joya actualizada con éxito', joya: result });
    } else {
      res.status(404).json({ message: 'Joya no encontrada' });
    }
  } catch (err) {
    console.error('Error al actualizar la joya:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Servidor escuchando
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
