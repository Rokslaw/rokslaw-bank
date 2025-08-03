const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const nodemailer = require('nodemailer');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'rokslaw-secret',
  resave: false,
  saveUninitialized: true,
}));

let users = {
  'client@example.com': { password: 'pass123', balance: 1000, transactions: [] },
};
let codes = {};

// Admin credentials
const ADMIN_EMAIL = 'kareemrokeeb795@gmail.com';

app.get('/', (req, res) => {
  res.send('Welcome to Rokslaw Bank API');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (users[email] && users[email].password === password) {
    req.session.user = email;
    res.json({ message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/admin/credit', (req, res) => {
  const { email, amount } = req.body;
  if (!users[email]) return res.status(404).json({ error: 'User not found' });
  users[email].balance += parseFloat(amount);
  users[email].transactions.push({ type: 'credit', amount, date: new Date() });
  res.json({ message: 'Funds credited' });
});

app.post('/transaction/start', (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: 'Not logged in' });

  const generatedCodes = [
    Math.floor(100 + Math.random() * 900).toString(),
    Math.floor(100 + Math.random() * 900).toString(),
    Math.floor(100 + Math.random() * 900).toString()
  ];

  codes[user] = generatedCodes;
  users[user].transactions.push({ type: 'verify', codes: generatedCodes, date: new Date() });

  // Send email via placeholder (SMTP should be configured in real usage)
  console.log(`Send codes to ${user}:`, generatedCodes);
  res.json({ message: '3 codes generated', codes: generatedCodes });
});

app.post('/transaction/verify', (req, res) => {
  const user = req.session.user;
  const { code1, code2, code3 } = req.body;

  if (!codes[user]) return res.status(400).json({ error: 'No transaction initiated' });

  const valid = codes[user].join(',') === [code1, code2, code3].join(',');
  if (valid) {
    delete codes[user];
    res.json({ message: 'Transaction verified and completed' });
  } else {
    res.status(400).json({ error: 'Verification failed' });
  }
});

app.get('/transactions', (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  res.json(users[user].transactions);
});

app.listen(3000, () => {
  console.log('Rokslaw Bank app running on http://localhost:3000');
});