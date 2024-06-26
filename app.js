const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const pool = require('./db/db'); 
const path = require('path');

const app = express();
const port = 3002;
const secretKey = 'your_secret_key'; 


app.use(cors({
  origin: ['https://consultancy-admin-1.onrender.com','http://localhost:3000', 'https://clever-pavlova-b60702.netlify.app/'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM admin WHERE email = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = result.rows[0];


    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '30m' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'none', secure: true });

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error('Error during login:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.log('Token verification error:', err.message);
      res.clearCookie('token', { httpOnly: true, sameSite: 'none', secure: true });
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.userId = decoded.id;
    next();
  });
};

app.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin WHERE id = $1', [req.userId]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user data:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
