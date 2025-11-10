const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================

// Helmet para seguridad básica
app.use(helmet());

// CORS configurado para GitHub Pages
app.use(cors({
    origin: [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // máximo 100 requests por IP
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// CONFIGURACIÓN DE MULTER PARA UPLOADS
// ============================================

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const { productName, category } = req.body;
        const folderName = productName.toLowerCase().replace(/\s+/g, '-');
        const uploadPath = path.join(
            process.env.REPO_PATH,
            'assets',
            'products',
            category,
            folderName
        );

        try {
            await fs.mkdir(uploadPath, { recursive: true });
            cb(null, uploadPath);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}_${timestamp}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif) o videos (mp4, webm)'));
    }
});

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No autorizado - Token requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }
        req.user = user;
        next();
    });
}

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

// Login para modo interno
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;

    if (password === process.env.INTERNAL_MODE_PASSWORD) {
        const token = jwt.sign(
            { mode: 'internal', timestamp: Date.now() },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            expiresIn: 86400 // 24 horas en segundos
        });
    } else {
        res.status(401).json({ error: 'Contraseña incorrecta' });
    }
});

// Verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

// ============================================
// RUTAS DE GESTIÓN DE IMÁGENES
// ============================================

// Subir nuevas imágenes
app.post('/api/images/upload', authenticateToken, upload.array('images', 10), async (req, res) => {
    try {
        const { productName, category } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No se recibieron archivos' });
        }

        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            relativePath: path.relative(process.env.REPO_PATH, file.path).replace(/\\/g, '/')
        }));

        res.json({
            success: true,
            message: `${uploadedFiles.length} archivo(s) subido(s) exitosamente`,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Error al subir imágenes:', error);
        res.status(500).json({ error: 'Error al subir imágenes', details: error.message });
    }
});

// Listar imágenes de un producto
app.get('/api/images/:category/:productName', authenticateToken, async (req, res) => {
    try {
        const { category, productName } = req.params;
        const folderName = productName.toLowerCase().replace(/\s+/g, '-');
        const folderPath = path.join(
            process.env.REPO_PATH,
            'assets',
            'products',
            category,
            folderName
        );

        const files = await fs.readdir(folderPath);
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm'].includes(ext);
        });

        const imagesWithStats = await Promise.all(
            imageFiles.map(async (file) => {
                const filePath = path.join(folderPath, file);
                const stats = await fs.stat(filePath);
                return {
                    filename: file,
                    relativePath: path.relative(process.env.REPO_PATH, filePath).replace(/\\/g, '/'),
                    size: stats.size,
                    modified: stats.mtime
                };
            })
        );

        res.json({
            success: true,
            productName,
            category,
            count: imagesWithStats.length,
            images: imagesWithStats
        });
    } catch (error) {
        console.error('Error al listar imágenes:', error);
        res.status(500).json({ error: 'Error al listar imágenes', details: error.message });
    }
});

// Eliminar imágenes
app.delete('/api/images/delete', authenticateToken, async (req, res) => {
    try {
        const { images } = req.body; // Array de rutas relativas

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de imágenes a eliminar' });
        }

        const results = [];

        for (const imagePath of images) {
            try {
                const fullPath = path.join(process.env.REPO_PATH, imagePath);
                await fs.unlink(fullPath);
                results.push({ path: imagePath, success: true });
            } catch (error) {
                results.push({ path: imagePath, success: false, error: error.message });
            }
        }

        const successCount = results.filter(r => r.success).length;

        res.json({
            success: true,
            message: `${successCount} de ${images.length} imagen(es) eliminada(s)`,
            results
        });
    } catch (error) {
        console.error('Error al eliminar imágenes:', error);
        res.status(500).json({ error: 'Error al eliminar imágenes', details: error.message });
    }
});

// Reordenar imágenes (renombrar archivos)
app.post('/api/images/reorder', authenticateToken, async (req, res) => {
    try {
        const { category, productName, orderedImages } = req.body;

        if (!orderedImages || !Array.isArray(orderedImages)) {
            return res.status(400).json({ error: 'Se requiere un array ordenado de imágenes' });
        }

        const folderName = productName.toLowerCase().replace(/\s+/g, '-');
        const folderPath = path.join(
            process.env.REPO_PATH,
            'assets',
            'products',
            category,
            folderName
        );

        // Crear temporales con nuevo orden
        const tempSuffix = '_temp_' + Date.now();
        const renamedFiles = [];

        // Paso 1: Renombrar a temporales
        for (let i = 0; i < orderedImages.length; i++) {
            const oldPath = path.join(process.env.REPO_PATH, orderedImages[i]);
            const ext = path.extname(orderedImages[i]);
            const tempName = `${i + 1}${tempSuffix}${ext}`;
            const tempPath = path.join(folderPath, tempName);

            await fs.rename(oldPath, tempPath);
            renamedFiles.push({ tempPath, index: i + 1, ext });
        }

        // Paso 2: Renombrar a nombres finales
        const finalFiles = [];
        for (const file of renamedFiles) {
            const finalName = `${productName.replace(/\s+/g, '_')}_${file.index}${file.ext}`;
            const finalPath = path.join(folderPath, finalName);
            await fs.rename(file.tempPath, finalPath);

            finalFiles.push({
                filename: finalName,
                relativePath: path.relative(process.env.REPO_PATH, finalPath).replace(/\\/g, '/')
            });
        }

        res.json({
            success: true,
            message: 'Imágenes reordenadas exitosamente',
            files: finalFiles
        });
    } catch (error) {
        console.error('Error al reordenar imágenes:', error);
        res.status(500).json({ error: 'Error al reordenar imágenes', details: error.message });
    }
});

// ============================================
// RUTAS DE GESTIÓN DE PDFs
// ============================================

// Subir PDF
app.post('/api/pdfs/upload', authenticateToken, upload.single('pdf'), async (req, res) => {
    try {
        const { productName, category } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió archivo PDF' });
        }

        const pdfPath = path.join(
            process.env.REPO_PATH,
            'assets',
            'pdfs',
            category,
            `${productName.replace(/\s+/g, '_')}.pdf`
        );

        await fs.mkdir(path.dirname(pdfPath), { recursive: true });
        await fs.rename(req.file.path, pdfPath);

        res.json({
            success: true,
            message: 'PDF subido exitosamente',
            file: {
                filename: path.basename(pdfPath),
                relativePath: path.relative(process.env.REPO_PATH, pdfPath).replace(/\\/g, '/')
            }
        });
    } catch (error) {
        console.error('Error al subir PDF:', error);
        res.status(500).json({ error: 'Error al subir PDF', details: error.message });
    }
});

// ============================================
// RUTA DE SALUD (HEALTH CHECK)
// ============================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor KOR Generadores Backend`);
    console.log(`📍 Escuchando en http://localhost:${PORT}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
    console.log(`📁 Repositorio: ${process.env.REPO_PATH}`);
    console.log(`\n✅ Servidor listo para recibir peticiones\n`);
});
