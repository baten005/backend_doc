const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendSingleSms } = require('./sms');

const generateOtp = () => {
  return crypto.randomInt(1000, 9999).toString();
};

const JWT_SECRET = 'your_jwt_secret_key';

const generateToken = (phoneNumber) => {
  return jwt.sign({ phoneNumber }, JWT_SECRET, { expiresIn: '30m' });
};

router.post('/otp', async (req, res) => {
  try {
    const { phoneNumber1 } = req.body;
    const otp = generateOtp();

    await pool.query(
      'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password = $2',
      [phoneNumber1, otp, 'client']
    );

    if (!phoneNumber1) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }
  
    /*const csmsId = Math.random().toString(36).substr(2, 9); // Generate a unique csms_id
  
    try {
      const response = await sendSingleSms(phoneNumber1, `Your OTP is ${otp}`, csmsId);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
      */
    console.log(`OTP for ${phoneNumber1}: ${otp}`);

    res.status(200).json(otp)
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating OTP');
  }
});

router.post('/verify-otp', async (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'none', secure: true });
  try {
    const { phoneNumber1, otp } = req.body;
     console.log(phoneNumber1,otp)
    const result = await pool.query('SELECT password FROM users WHERE email = $1', [phoneNumber1]);
    if (result.rows.length === 0) {
      return res.status(404).send('Phone number not found');
    }

    const userOtp = result.rows[0].password;
    
    if (userOtp === otp) {
      const token = generateToken(phoneNumber1);
      res.cookie('token', token, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 1800000 });
      
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

  router.get('/packages1',async (req, res) => {
    try {
    
      const result=await pool.query(
        'SELECT * FROM public."package" ORDER BY package_id ASC'
      );
      
  res.status(200).json(result.rows);

    
    } catch (err) {
      console.error(err);
      res.status(500).send('Error generating OTP');
    }
  });
  router.get('/packages',async (req, res) => {
    const date=req.query.formatedDate;
    console.log(date)
    try {
    
        
        const result1 = await pool.query(
          `SELECT ts.slot_id, ts.time_slot
           FROM time_slot ts
           LEFT JOIN appointment a ON ts.slot_id = a.slot_id AND a.appoint_date = $1
           LEFT JOIN blocked_schedules bs ON bs.schedule_date = $1
           WHERE a.slot_id IS NULL
             AND (bs IS NULL OR (
                  (ts.slot_id = 1 AND bs.time_slot1 = '0') OR
                  (ts.slot_id = 2 AND bs.time_slot2 = '0') OR
                  (ts.slot_id = 3 AND bs.time_slot3 = '0') OR
                  (ts.slot_id = 4 AND bs.time_slot4 = '0') OR
                  (ts.slot_id = 5 AND bs.time_slot5 = '0') OR
                  (ts.slot_id = 6 AND bs.time_slot6 = '0') OR
                  (ts.slot_id = 7 AND bs.time_slot7 = '0') OR
                  (ts.slot_id = 8 AND bs.time_slot8 = '0') OR
                  (ts.slot_id = 9 AND bs.time_slot9 = '0')
              ))`,
          [date]
      );
    
    res.status(200).json(result1.rows);

      
      } catch (err) {
        console.error(err);
        res.status(500).send('Error generating OTP');
      }
  });

  router.post('/payment1', verifyToken, async (req, res) => {
    res.json('https://www.youtube.com/')
  });

module.exports = router;
