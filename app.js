const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const pool = require('./db/db'); 
const path = require('path');
const app = express();
const port = 3003;
const secretKey = 'your_secret_key'; 

app.use(cors({
  origin: ['https://consultancy-admin-1.onrender.com','http://localhost:3000','http://localhost:9000', 'https://clever-pavlova-b60702.netlify.app' ,'https://calenderkaka.000webhostapp.com'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
 console.log(username,password)
  try {
    const result = await pool.query('SELECT * FROM admin WHERE username = $1', [username]);
    console.log(result.rows);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = result.rows[0];


    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '30d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'none', secure: true });

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error('Error during login:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'none', secure: true });
  res.status(200).json({ message: 'Logout successful' });
});

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log(token)

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
    const result = await pool.query(`SELECT a.id, a.username, ap.dashboard, ap.appointment, ap.payment, ap.package, ap.promotion, ap.permission
      FROM admin a
      LEFT JOIN admin_permission ap ON a.id = ap.admin_id WHERE a.id = $1`, [req.userId]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user data:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/addAdmin', authenticateToken, async (req, res) => {
  const { admin, password } = req.body;

  try {
    await pool.query('SELECT setval(\'admin_id_seq\', (SELECT MAX(id) FROM admin))');

    const result = await pool.query(
      'INSERT INTO public.admin(username, password) VALUES ($1, $2) RETURNING id',
      [admin, password]
    );
   const id=await pool.query('SELECT id From public.admin where username = $1 ',[admin]);
   console.log(id.rows[0].id)
    const result1 = await pool.query(
      'INSERT INTO public.admin_permission(admin_id, dashboard, appointment, payment, "package", promotion, permission)VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id.rows[0].id, true,false,false,false,false,false]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting admin:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
  console.log(admin, password);
});

app.get('/getAdmins', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.username, ap.dashboard, ap.appointment, ap.payment, ap.package, ap.promotion, ap.permission
      FROM admin a
      LEFT JOIN admin_permission ap ON a.id = ap.admin_id
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching admins:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/updateAdminPermission', authenticateToken, async (req, res) => {
  const data=req.body.selectedPermissions;
  const admin_id=req.body.admin;
  console.log(data)
  const allPermissions = ['dashboard', 'appointment', 'payment', 'package', 'promotion', 'permission'];

  try {
    for (const permission of allPermissions) {
      const value = data.includes(permission.charAt(0).toUpperCase() + permission.slice(1)) ? true : false;
     const det= await pool.query(`UPDATE admin_permission SET ${permission} = $1 WHERE admin_id = $2`, [value, admin_id]);
     console.log(value)
  }

  await pool.query('COMMIT');
  res.status(200).json({ message: 'Permissions updated successfully' });
  } catch (err) {
    console.error('Error fetching admins:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//--------------------------package--------------------
app.get('/package', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT package_id AS _id, name, price FROM package');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching packages:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/package', authenticateToken, async (req, res) => {
  const { name, price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO package (name, price) VALUES ($1, $2) RETURNING package_id AS _id, name, price',
      [name, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding package:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/package/:id',authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM package WHERE package_id = $1', [id]);
    res.status(200).json({ message: 'Package removed successfully' });
  } catch (error) {
    console.error('Error removing package:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/////////----------------

//------------------------appointment------------------

app.get('/timeslots', authenticateToken, async (req, res) => {
  const { date } = req.query;
  if (!date) {
      return res.status(400).send('Date is required');
  }

  try {
      const result = await pool.query(
          `SELECT ts.slot_id, ts.time_slot
           FROM time_slot ts
           LEFT JOIN appointment a ON ts.slot_id = a.slot_id AND a.appoint_date = $1
           WHERE a.slot_id IS NULL`,
          [date]
      );
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching time slots:', error);
      res.status(500).send('Server error');
  }
});

app.post('/appointment', authenticateToken,  async (req, res) => {
  const { package_id, appoint_type, appoint_date, user_fullname, user_phonenum, slot_id } = req.body;

  if (!package_id || !appoint_type || !appoint_date || !user_fullname || !user_phonenum || !slot_id) {
      return res.status(400).send('All fields are required');
  }

  try {
      const result = await pool.query(
          `INSERT INTO appointment (package_id, appoint_type, appoint_date, user_fullname, user_phonenum, slot_id)
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [parseInt(package_id), appoint_type, appoint_date, user_fullname, user_phonenum, slot_id] 
      );
      res.status(201).json(result.rows[0]);
  } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).send('Server error');
  }
});



//---------------------------------------------

//-------------------payment--------------------
app.get('/payments',authenticateToken, async (req, res) => {
  const { search } = req.query;

  try {
      let result;
      if (search) {
          result = await pool.query(`
              SELECT 
                  a.user_fullname, 
                  a.user_phonenum, 
                  p.amount, 
                  pa.name AS package_name, 
                  to_char(p.date, 'DD Mon, YYYY') AS payment_date,
                  to_char(p.time, 'HH:MI AM') AS payment_time
              FROM 
                  payment p
              JOIN 
                  appointment a ON a.appointment_id = p.appointment_id
              JOIN 
                  package pa ON a.package_id = pa.package_id
              WHERE 
                  a.user_fullname ILIKE $1 OR a.user_phonenum ILIKE $1
              ORDER BY 
                  p.date DESC, p.time DESC
          `, [`%${search}%`]);
      } else {
    
                result = await pool.query(`
              SELECT 
                  a.user_fullname, 
                  a.user_phonenum, 
                  p.amount, 
                  pa.name AS package_name, 
                  to_char(p.date, 'DD Mon, YYYY') AS payment_date,
                  to_char(p.time, 'HH:MI AM') AS payment_time
              FROM 
                  payment p
              JOIN 
                  appointment a ON a.appointment_id = p.appointment_id
              JOIN 
                  package pa ON a.package_id = pa.package_id
              ORDER BY 
                  p.date DESC, p.time DESC
          `);
      }

      if (result.rows.length > 0) {
          res.json(result.rows);
      } else {
          res.status(200).json(null);
      }
  } catch (error) {
      console.error('Error fetching payments:', error.stack);
      res.status(500).json({ error: 'Internal server error' });
  }
});




//---------------------------------------------

app.post('/changepassword', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  try {
    const result = await pool.query('SELECT password FROM admin WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found.' });
    }

    const user = result.rows[0];

    if (currentPassword !== user.password) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    await pool.query('UPDATE admin SET password = $1 WHERE id = $2', [newPassword, userId]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


app.get('/',async (req, res) => {
 res.send('kaka')
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
