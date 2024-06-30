const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const generateOtp = () => {
  return crypto.randomInt(1000, 9999).toString();
};

const JWT_SECRET = 'your_jwt_secret_key';

const generateToken = (phoneNumber) => {
  return jwt.sign({ phoneNumber }, JWT_SECRET, { expiresIn: '30m' });
};

router.post('/otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const otp = generateOtp();

    await pool.query(
      'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password = $2',
      [phoneNumber, otp, 'client']
    );

    console.log(`OTP for ${phoneNumber}: ${otp}`);

    res.status(200).send('OTP sent successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating OTP');
  }
});

router.post('/verify-otp', async (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'none', secure: true });
  try {
    const { phoneNumber, otp } = req.body;
     console.log(phoneNumber,otp)
    const result = await pool.query('SELECT password FROM users WHERE email = $1', [phoneNumber]);
    if (result.rows.length === 0) {
      return res.status(404).send('Phone number not found');
    }

    const userOtp = result.rows[0].password;
    
    if (userOtp === otp) {
      const token = generateToken(phoneNumber);
      //res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 1800000 });
      res.cookie('token', token, { 
        domain: 'hurairaconsultancy.com',
        path: '/',
        httpOnly: true,
        secure: false, // Set to true if using HTTPS
        sameSite: 'Lax' // or 'None' if cross-site cookies are needed
      });
      res.status(200).json({ token });
    } else {
      res.status(400).send('Invalid OTP');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error verifying OTP');
  }
});

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
  console.log('token',token)
  if (!token) {
    return res.status(401).send('Access Denied');
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send('Invalid token');
    }
    req.phoneNumber = decoded.phoneNumber;
    next();
  });
};


  
  router.post('/verify-login', verifyToken, async (req, res) => {
    try {

      const { phoneNumber } = req;
      
  
      res.status(200).json({ isAuthenticated: true, phoneNumber });
    } catch (err) {
      console.error('Error verifying login:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  router.get('/packages',async (req, res) => {
    try {
    
        const result=await pool.query(
          'SELECT * FROM public."package" ORDER BY package_id ASC'
        );
        const result1=await pool.query(
            'SELECT * FROM public.time_slot ORDER BY slot_id ASC'
          );
    
    res.status(200).json([result.rows, result1.rows]);

      
      } catch (err) {
        console.error(err);
        res.status(500).send('Error generating OTP');
      }
  });

  router.post('/payment', verifyToken, async (req, res) => {
    res.json('https://www.youtube.com/')
  });

module.exports = router;
