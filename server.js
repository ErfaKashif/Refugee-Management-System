require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname), { index: false }));

// Existing Routes
const refugeeRouter = require('./routes/refugeeRoutes');
const organizationRouter = require('./routes/organizationRoutes');
const coordinatorRouter = require('./routes/coordinatorRoutes');
const shelterRouter = require('./routes/shelterRoutes');
const doctorRouter = require('./routes/doctorRoutes');
const campRouter = require('./routes/campRoutes');
const volunteerRouter = require('./routes/volunteerRoutes');
const userRouter = require('./routes/userRoutes');
const adminRouter = require('./routes/adminRoutes');
const medicalRouter = require('./routes/medicalRoutes');
const incidentsRouter = require('./routes/incidentRoutes');
const iventoryRouter = require('./routes/inventoryRoutes');
// New Routes
const donationRouter = require('./routes/donationRoutes');
const aidRouter = require('./routes/aidRoutes');
const loginRouter = require('./routes/loginRoutes');

app.use('/login', loginRouter);
// API Routes
app.use('/api/refugees', refugeeRouter);
app.use('/api/orgs', organizationRouter);
app.use('/api/coordinators', coordinatorRouter);
app.use('/api/shelters', shelterRouter);
app.use('/api/camps', campRouter);
app.use('/api/doctors', doctorRouter);
app.use('/api/volunteers', volunteerRouter);
app.use('/api/users', userRouter);
app.use('/api/admin',adminRouter);
// New API Routes
app.use('/api/donations', donationRouter);
app.use('/api/aid', aidRouter);
app.use('/api/medical',medicalRouter);
app.use('/api/incidents',incidentsRouter);
app.use('/api/inventory',iventoryRouter);
// HTML Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'refugees.html'));
});

app.get('/organizations', (req, res) => {
  res.sendFile(path.join(__dirname, 'organization.html'));
});

app.get('/coordinators', (req, res) => {
  res.sendFile(path.join(__dirname, 'coordinator.html'));
});

app.get('/shelters', (req, res) => {
  res.sendFile(path.join(__dirname, 'shelter.html'));
});

app.get('/camps', (req, res) => {
  res.sendFile(path.join(__dirname, 'camp.html'));
});

app.get('/doctors', (req, res) => {
  res.sendFile(path.join(__dirname, 'doctor.html'));
});

app.get('/volunteers', (req, res) => {
  res.sendFile(path.join(__dirname, 'volunteer.html'));
});

app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'user.html'));
});

// New Pages
app.get('/donations', (req, res) => {
  res.sendFile(path.join(__dirname, 'donation.html'));
});

app.get('/aid', (req, res) => {
  res.sendFile(path.join(__dirname, 'aid.html'));
});
app.get('/admin',(req,res)=>{
  res.sendFile(path.join(__dirname,adminView.html));
});

app.get('/medical',(req,res)=>{
  res.sendFile(path.join(__dirname,medical.html));
});

app.get('/incidents',(req,res)=>{
  res.sendFile(path.join(__dirname,incidents.html));
});

app.get('/inventory',(req,res)=>{
  res.sendFile(path.join(__dirname,inventory.html));
});
// Test Routes
app.get('/api/test', (req, res) => res.json({ ok: true }));
app.get('/api/test-orgs', (req, res) => res.json({ orgsMounted: true }));
// 404 Handler
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }

  res.status(404).send('Page not found');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}/login-choice.html`);
});