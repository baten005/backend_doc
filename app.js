const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const pool = require('./db/db');
const otp=require('./routes/user'); 
const payment=require('./routes/payment');
const blockScheduleRouter = require('./routes/blockSchedule');
const path = require('path');
const fs = require('fs');
const { error } = require('console');
const app = express();
const port = 3003;
const secretKey = 'your_secret_key'; 
const https = require('https');
console.log(__dirname)
/*const privateKeyPath = path.join(__dirname, 'backend.hurairaconsultancy.com', 'privkey.pem');
const certificatePath = path.join(__dirname, 'backend.hurairaconsultancy.com', 'cert.pem');
const caPath = path.join(__dirname, 'backend.hurairaconsultancy.com', 'chain.pem');

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const certificate = fs.readFileSync(certificatePath, 'utf8');
const ca = fs.readFileSync(caPath, 'utf8');

const credentials = { key: privateKey, cert: certificate, ca: ca };
*/




/*
const privateKey = fs.readFileSync('/etc/letsencrypt/live/backend.hurairaconsultancy.com/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/backend.hurairaconsultancy.com/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/backend.hurairaconsultancy.com/chain.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate, ca: ca };
*/
app.use(cors({
  origin: ['https://consultancy-admin-1.onrender.com','http://localhost:3000','http://localhost:3001', 'http://93.127.166.229:81', 'http://93.127.166.229:82','https://www.hurairaconsultancy.com','http://admin.hurairaconsultancy.com'
    ,'https://hurairaconsultancy.com','https://admin.hurairaconsultancy.com'
    ,'https://backend.hurairaconsultancy.com/login'
    ,'https://backend.hurairaconsultancy.com/dashboard'
  ], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());
app.use(otp);
app.use(payment);
app.use(blockScheduleRouter)

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

    const token1 = jwt.sign({ id: user.id }, secretKey, { expiresIn: '30d' });
    res.cookie('token1', token1, { httpOnly: true, sameSite: 'none', secure: true });

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error('Error during login:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('token1', { httpOnly: true, sameSite: 'none', secure: true });
  res.status(200).json({ message: 'Logout successful' });
});

const authenticateToken = (req, res, next) => {
  const token1 = req.cookies.token1;
  console.log(token1)

  if (!token1) {
    return res.status(401).json({ message: 'Access denied' });
  }

  jwt.verify(token1, secretKey, (err, decoded) => {
    if (err) {
      console.log('Token verification error:', err.message);
      res.clearCookie('token1', { httpOnly: true, sameSite: 'none', secure: true });
      return res.status(403).json({ message: 'Invalid or expired token1' });
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
    // Update the sequence for the admin_id_seq
    await pool.query('SELECT setval(\'admin_id_seq\', (SELECT MAX(id) FROM admin))');

    // Insert into admin and return the id
    const result = await pool.query(
      'INSERT INTO public.admin(username, password) VALUES ($1, $2) RETURNING id',
      [admin, password]
    );

    const adminId = result.rows[0].id;

    // Insert into admin_permission using the returned id
    await pool.query(
      'INSERT INTO public.admin_permission(admin_id, dashboard, appointment, payment, "package", promotion, permission) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [adminId, true, false, false, false, false, false]
    );

    res.status(200).json({ id: adminId });
  } catch (err) {
    console.error('Error inserting admin:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
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

// ------------Dashboard-------------------

app.get('/timeslotsdashboard', authenticateToken, async (req, res) => {
  try {
      const query = `
          SELECT 
              ts.slot_id, 
              ts.time_slot, 
              a.appointment_id, 
              a.appoint_type, 
              a.appoint_date, 
              a.user_fullname, 
              a.user_phonenum,
              p.name AS package_name, 
              p.price
          FROM 
              time_slot ts
          LEFT JOIN 
              appointment a ON ts.slot_id = a.slot_id
          LEFT JOIN 
              package p ON a.package_id = p.package_id
          ORDER BY 
              ts.slot_id, a.appoint_date;
      `;
      const result = await pool.query(query);


      const timeSlots = [];
      let currentSlot = null;

      result.rows.forEach((row) => {
          if (!currentSlot || currentSlot.slot_id !== row.slot_id) {
              currentSlot = {
                  slot_id: row.slot_id,
                  time_slot: row.time_slot,
                  appointments: [],
              };
              timeSlots.push(currentSlot);
          }
          if (row.appointment_id) {
              currentSlot.appointments.push({
                  appointment_id: row.appointment_id,
                  appoint_type: row.appoint_type,
                  appoint_date: row.appoint_date,
                  user_fullname: row.user_fullname,
                  user_phonenum: row.user_phonenum,
                  package_name: row.package_name,
                  price: row.price,
                  time_slot: row.time_slot, 
              });
          }
      });

      res.json(timeSlots);
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Server error');
  }
});

// Fetch appointments for today
app.get('/todayappointments', authenticateToken, async (req, res) => {
  try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const query = `
          SELECT * FROM appointment
          WHERE appoint_date >= $1 AND appoint_date < $2
      `;
      const { rows } = await pool.query(query, [startOfDay, endOfDay]);
      res.json(rows);
  } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      res.status(500).json({ error: 'Server error' });
  }
});

// Fetch monthly statistics
app.get('/monthlystats', authenticateToken, async (req, res) => {
  try {
      const today = new Date();
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
console.log(thisMonthStart);
      const query = `
          SELECT
              COUNT(DISTINCT user_phonenum) AS totalUsers,
              (SELECT COUNT(DISTINCT user_phonenum) FROM appointment WHERE appoint_date >= $1 AND appoint_date < $2) AS lastMonthUsers,
              (SELECT COUNT(*) FROM appointment WHERE appoint_date >= $3 AND appoint_date < $4) AS thisMonthReservations,
              (SELECT COUNT(*) FROM appointment WHERE appoint_date >= $1 AND appoint_date < $2) AS lastMonthReservations
          FROM appointment;
      `;

      const { rows } = await pool.query(query, [
        lastMonthStart,
        lastMonthEnd,
        thisMonthStart,
        thisMonthEnd
      ]);

      res.json(rows[0]);
  } catch (error) {
      console.error('Error fetching monthly statistics:', error);
      res.status(500).json({ error: 'Server error' });
  }
});


app.delete('/cancelappointment/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM appointment WHERE appointment_id = $1', [id]);
    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Appointment cancelled successfully' });
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Server error' });
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
app.post('/updateappointment', authenticateToken, async (req, res) => {
  const { date,timeSlot } = req.body;
  const a_id = req.query.appoinment_id;
  console.log(date,timeSlot,a_id)

  try {
    const result = await pool.query('UPDATE appointment SET appoint_date = $1,slot_id=$2  WHERE appointment_id = $3', [date,timeSlot,a_id]);

    res.status(200).json('updated');

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/deleteAdmin', authenticateToken, async (req, res) => {
  const { admin } = req.body;
  
  console.log(admin)

  try {
    const result = await pool.query('DELETE FROM public.admin WHERE id=$1;', [admin]);
    const result1 = await pool.query('DELETE FROM public.admin_permission WHERE admin_id=$1;', [admin]);

    res.status(200).json('updated');

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
/*https.createServer(credentials, app).listen(port, () => {
  console.log(`Server running on port ${port}`);
});*/
