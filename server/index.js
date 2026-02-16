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

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('Created uploads directory');
}

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/certificates', certificateRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/email-templates', emailTemplateRoutes);

// Supabase client setup
// Supabase client setup (Legacy - Moved to MongoDB)
// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_KEY;
// const supabase = createClient(supabaseUrl, supabaseKey); 


app.get('/', (req, res) => {
  res.send('CertiFlow Server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
