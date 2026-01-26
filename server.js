const express = require('express');
const multer = require('multer');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Configure Multer for image storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images are allowed (jpeg, jpg, png, gif, webp)!'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Serve uploaded images specifically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const os = require('os');

// ... existing imports ...

// Helper function to get local IP address
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// ... existing code ...

// Upload endpoint
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an image file.' });
        }

        // Construct public URL for the image
        const protocol = req.protocol;
        // Use the host header which includes the domain and port (if any) as seen by the client/proxy
        const host = req.get('host');

        // We use a view URL so users can see the image in a nice page, or direct file
        // Requirement: "generate a unique URL... When scanned... opens a browser page that displays the uploaded image"
        // Let's create a specific view page for it.
        const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        // Generate QR Code pointing to the image URL
        const qrCodeDataUrl = await qrcode.toDataURL(imageUrl);

        res.json({
            success: true,
            imageUrl: imageUrl,
            qrCode: qrCodeDataUrl
        });

    } catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Text/URL Generation Endpoint

app.post('/generate', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Please enter text or URL.' });
        }

        // Generate QR Code directly from text
        const qrCodeDataUrl = await qrcode.toDataURL(text);

        res.json({
            success: true,
            qrCode: qrCodeDataUrl
        });

    } catch (error) {
        console.error('Error generating QR:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});

app.listen(PORT, () => {
    console.log(`Server running on:`);
    console.log(`- Local:   http://localhost:${PORT}`);
    console.log(`- Network: http://${getLocalIp()}:${PORT}`);
});
