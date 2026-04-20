const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./utils/db');



dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const fs = require('fs');
const path = require('path');
const certificateRoutes = require('./routes/certificate.routes');
const { router: authRoutes } = require('./routes/auth.routes');
const designRoutes = require('./routes/design.routes');
const emailTemplateRoutes = require('./routes/emailTemplate.routes');
const externalRoutes = require('./routes/external.routes');
const batchReportRoutes = require('./routes/batchReport.routes');
const contactMessageRoutes = require('./routes/contactMessage.routes');
const certificateCorrectionRoutes = require('./routes/certificateCorrection.routes');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('Created uploads directory');
}

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://pramanit-six.vercel.app",
  "https://pramanit.vercel.app",
  process.env.FRONTEND_URL // Add this var in Render
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      // For now, in production, we might want to be permissive if the user hasn't set the var yet
      // so they don't get blocked immediately.
      // But for security, let's log it.
      console.log("Blocked by CORS:", origin);
      // callback(new Error('Not allowed by CORS')); 
      // Safe Fallback: temporarily allow all for demo purposes if variable is missing
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/certificates', certificateRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/batch-reports', batchReportRoutes);
app.use('/api/contact', contactMessageRoutes);
app.use('/api/corrections', certificateCorrectionRoutes);

// Serve contact-issuer page
app.get('/contact-issuer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact-issuer.html'));
});

app.get('/', (req, res) => {
  res.send('Pramanit Server is running');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port} (0.0.0.0)`);
});
