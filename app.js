const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { pool } = require("./db/db");
const otp = require("./routes/user");
const payment = require("./routes/payment");
const blockScheduleRouter = require("./routes/blockSchedule");
const path = require("path");
const fs = require("fs");
const { error } = require("console");
const app = express();
const port = 3003;
const secretKey = crypto.randomBytes(32).toString("hex");
const {
  scheduleAppointmentReminders
} = require("./routes/appointmentReminderScheduler");

const https = require("https");

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
app.use(
  cors({
    origin: [
      "https://consultancy-admin-1.onrender.com",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://93.127.166.229:81",
      "http://93.127.166.229:82",
      "https://www.hurairaconsultancy.com",
      "http://admin.hurairaconsultancy.com",
      "https://hurairaconsultancy.com",
      "https://admin.hurairaconsultancy.com",
      "https://backend.hurairaconsultancy.com/login",
      "https://backend.hurairaconsultancy.com/dashboard",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(otp);
app.use(payment);
app.use(blockScheduleRouter);

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const [result] = await pool.query(
      "SELECT * FROM admin WHERE username = ?",
      [username]
    );
   
    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result;

    
    if (password !== user[0].password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    const [permission] = await pool.query(
      "SELECT dashboard,promotion FROM admin_permission where admin_id=?",
      [result[0].id]
    );
    
    const token1 = jwt.sign({ id: user[0].id }, secretKey, {
      expiresIn: "30d",
    });
    
    //res.setHeader('Authorization', `Bearer ${token1}`);
    res
      .status(200)
      .json({
        message: "Login successful",
        authorization: token1,
        permission: permission[0].dashboard == 1 ? "true" : "false",
        permission1: permission[0].promotion == 1 ? "true" : "false",
      });
  } catch (err) {
    console.error("Error during login:", err.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/logout", (req, res) => {
  //res.clearCookie("token1", { httpOnly: true, sameSite: "none", secure: true });
  res.status(200).json({ message: "Logout successful" });
});

/*const authenticateToken = (req, res, next) => {
  const token1 = req.cookies.token1;
  console.log(token1);

  if (!token1) {
    return res.status(401).json({ message: "Access denied" });
  }

  jwt.verify(token1, secretKey, (err, decoded) => {
    if (err) {
      console.log("Token verification error:", err.message);
      res.clearCookie("token1", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      return res.status(403).json({ message: "Invalid or expired token1" });
    }

    req.userId = decoded.id;
    console.log(req.userId);

    next();
  });
};
*/
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token1 = authHeader && authHeader.split(' ')[1];
  

  if (!token1) {
    return res.status(401).json({ message: "Access denied" });
  }

  jwt.verify(token1, secretKey, (err, decoded) => {
    if (err) {
      
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.userId = decoded.id;
   

    next();
  });
};

//------------------------------------permission------------------------

app.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query(
      `SELECT a.id, a.username, ap.dashboard, ap.appointment, ap.payment, ap.package, ap.promotion, ap.permission
      FROM admin a
      LEFT JOIN admin_permission ap ON a.id = ap.admin_id WHERE a.id = ?`,
      [req.userId]
    );
    res.status(200).json(result[0]);
  } catch (err) {
    console.error("Error fetching user data:", err.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/addAdmin", authenticateToken, async (req, res) => {
  const { admin, password } = req.body;

  try {
    // Insert into admin and retrieve the last inserted ID
    const [result] = await pool.query(
      "INSERT INTO admin(username, password) VALUES (?, ?)",
      [admin, password]
    );

    const adminId = result.insertId; // Retrieve the last inserted ID

    // Insert into admin_permission using the retrieved admin ID
    await pool.query(
      "INSERT INTO admin_permission(admin_id, dashboard, appointment, payment, package, promotion, permission) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [adminId, 1, 0, 0, 0, 0, 0]
    );

    res.status(200).json({ id: adminId });
  } catch (err) {
    console.error("Error inserting admin:", err.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getAdmins", authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT a.id, a.username, ap.dashboard, ap.appointment, ap.payment, ap.package, ap.promotion, ap.permission
      FROM admin a
      LEFT JOIN admin_permission ap ON a.id = ap.admin_id
    `);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching admins:", err.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/updateAdminPermission", authenticateToken, async (req, res) => {
  const data = req.body.selectedPermissions;
  const admin_id = req.body.admin;
  
  const allPermissions = [
    "dashboard",
    "appointment",
    "payment",
    "package",
    "promotion",
    "permission",
  ];

  try {
    for (const permission of allPermissions) {
      const value = data.includes(
        permission.charAt(0).toUpperCase() + permission.slice(1)
      )
        ? true
        : false;
      const [det] = await pool.query(
        `UPDATE admin_permission SET ${permission} = ? WHERE admin_id = ?`,
        [value, admin_id]
      );
      
    }

    await pool.query("COMMIT");
    res.status(200).json({ message: "Permissions updated successfully" });
  } catch (err) {
    console.error("Error fetching admins:", err.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/deleteAdmin", authenticateToken, async (req, res) => {
  const { admin } = req.body;

  

  try {
    const result = await pool.query("DELETE FROM public.admin WHERE id=$1;", [
      admin,
    ]);
    const result1 = await pool.query(
      "DELETE FROM public.admin_permission WHERE admin_id=$1;",
      [admin]
    );

    res.status(200).json("updated");
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
// ------------------------------Dashboard-------------------

app.get("/timeslotsdashboard", authenticateToken, async (req, res) => {
  try {
    const query = `
          SELECT 
              ts.slot_id, 
              ts.time_slot, 
              a.appointment_id, 
              a.appoint_type, 
              a.appoint_date, 
              a.user_fullname,
              p.duration, 
              a.user_phonenum,
              p.name AS package_name, 
              p.price_inTaka
          FROM 
              time_slot ts
          LEFT JOIN 
              appointment a ON ts.slot_id = a.slot_id
          LEFT JOIN 
              package p ON a.package_id = p.package_id
          ORDER BY 
              ts.slot_id, a.appoint_date;
      `;
    const [result] = await pool.query(query);

    const timeSlots = [];
    let currentSlot = null;

    result.forEach((row) => {
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
          price: row.price_inTaka,
          time_slot: row.time_slot,
          duration:row.duration
        });
      }
    });
   
    res.json(timeSlots);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Server error");
  }
});

//fetch today appointment
app.get("/todayappointments", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const query = `
      SELECT 
        CAST(
          (
            (SELECT COUNT(*) / 2 
             FROM appointment 
             JOIN package ON appointment.package_id = package.package_id 
             WHERE appointment.appoint_date >= ? AND appointment.appoint_date < ? AND package.duration = '1.5')
            +
            (SELECT COUNT(*) 
             FROM appointment 
             JOIN package ON appointment.package_id = package.package_id 
             WHERE appointment.appoint_date >= ? AND appointment.appoint_date < ? AND package.duration = '1.0')
          ) AS UNSIGNED
        ) AS total_appointments;
    `;



    const [rows] = await pool.query(query, [startOfDay, endOfDay, startOfDay, endOfDay]);
    
    // Log the result

    res.json({ totalAppointments: rows[0]?.total_appointments || 0 });
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    res.status(500).json({ error: "Server error" });
  }
});

//fetch monthly
app.get("/monthlystats", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);

    const query = `
      SELECT
        COUNT(DISTINCT user_phonenum) AS totalUsers,
        (SELECT COUNT(DISTINCT user_phonenum) 
         FROM appointment 
         WHERE appoint_date >= ? AND appoint_date < ?) AS lastMonthUsers,
         
        CAST(
          (
            (SELECT COUNT(*) / 2 
             FROM appointment 
             JOIN package ON appointment.package_id = package.package_id 
             WHERE appoint_date >= ? AND appoint_date < ? AND package.duration = '1.5')
            +
            (SELECT COUNT(*) 
             FROM appointment 
             JOIN package ON appointment.package_id = package.package_id 
             WHERE appoint_date >= ? AND appoint_date < ? AND package.duration = '1.0')
          ) AS UNSIGNED
        ) AS thisMonthReservations,

        CAST(
          (
            (SELECT COUNT(*) / 2 
             FROM appointment 
             JOIN package ON appointment.package_id = package.package_id 
             WHERE appoint_date >= ? AND appoint_date < ? AND package.duration = '1.5')
            +
            (SELECT COUNT(*) 
             FROM appointment 
             JOIN package ON appointment.package_id = package.package_id 
             WHERE appoint_date >= ? AND appoint_date < ? AND package.duration = '1.0')
          ) AS UNSIGNED
        ) AS lastMonthReservations
      FROM appointment;
    `;

    const [rows] = await pool.query(query, [
      lastMonthStart,
      lastMonthEnd, // Last month user phone numbers
      thisMonthStart,
      thisMonthEnd, // This month reservations
      thisMonthStart,
      thisMonthEnd, // This month reservations
      lastMonthStart,
      lastMonthEnd, // Last month reservations
      lastMonthStart,
      lastMonthEnd  // Last month reservations
    ]);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching monthly statistics:", error);
    res.status(500).json({ error: "Server error" });
  }
});


app.delete("/cancelappointment/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM appointment WHERE appointment_id = ?",
      [id]
    );
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Appointment cancelled successfully" });
    } else {
      res.status(404).json({ message: "Appointment not found" });
    }
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ error: "Server error" });
  }
});


const updateQuery = async (req, res, date, ts, appointment,sendRes) => {
  console.log('koibar hanse',appointment)
  try {
    const [result] = await pool.query(
      "UPDATE appointment SET appoint_date = ?, slot_id = ? WHERE appointment_id = ?",
      [date, ts, appointment]
    );
    if(sendRes=='2'){
      if (result.affectedRows > 0) {
      res.status(200).json("updated");
    } else {
      res.status(404).json({ message: "Appointment not found" });
    }
    }
    
  } catch (error) {
    console.error("Error updating appointment:", error);
    if(sendRes=='2')
    res.status(500).json({ error: "Internal server error." });
  }
};
const counterAppointId = async (date,ts) => {
  console.log(date,ts,'counter func');
  
  try {
    const [result] = await pool.query(
      "SELECT appointment_id FROM appointment WHERE DATE(appoint_date) = ? and slot_id = ?",
      [date, ts]
    );
    console.log(result,'sama lagaise')
    if (result.length > 0) {
      return result[0].appointment_id;
    } else {
      return 10;
    }
  } catch (error) {
    console.error("Error updating appointment:", error);
    return 0;
  }
};

const moment = require('moment-timezone');

const adjustDateForTimezone = (dateString) => {
  // Convert the date from UTC to your local timezone (e.g., Asia/Dhaka)
  return moment.tz(dateString, 'Asia/Dhaka').format('YYYY-MM-DD');
};
app.post("/updateappointment", authenticateToken, async (req, res) => {
  const { date, time_Slot } = req.body;
  const a_id = req.query.appointment_id;
  console.log(date, time_Slot, a_id);
  const timeSlot1=time_Slot.split('')[0];
  const timeSlot = Number(timeSlot1);
  console.log(timeSlot)
  try {
    const [type] = await pool.query(
      `SELECT duration, slot_id, DATE(appoint_date) as appoint_date 
       FROM appointment 
       INNER JOIN package ON package.package_id = appointment.package_id 
       WHERE appointment_id = ?`,
      [a_id]
    );
    const localAppointDate = adjustDateForTimezone(type[0].appoint_date);
 console.log(type,localAppointDate,'this is the type');   
    if (type[0].duration == '1.5') {
      if (type[0].slot_id == '1') {
        const counter=await counterAppointId(localAppointDate,'2');
        console.log(counter,'counter')
        await updateQuery(req, res, date, timeSlot, a_id,'1');
        await updateQuery(req, res, date, timeSlot+1, counter,'2');
      }else if (type[0].slot_id == '3') {
        const counter=await counterAppointId(localAppointDate,'4');
        await updateQuery(req, res, date, timeSlot, a_id,'1');
        await updateQuery(req, res, date, timeSlot+1, counter,'2');
      }else if (type[0].slot_id == '5') {
        const counter=await counterAppointId(localAppointDate,'6');
        await updateQuery(req, res, date, timeSlot, a_id,'1');
        await updateQuery(req, res, date, timeSlot+1, counter,'2');
      }
      else if (type[0].slot_id == '8') {
        const counter=await counterAppointId(localAppointDate,'9');
        await updateQuery(req, res, date, timeSlot, a_id,'1');
        await updateQuery(req, res, date, timeSlot+1, counter,'2');
      }
      else if (type[0].slot_id == '2') {
        const counter=await counterAppointId(localAppointDate,'1');
        await updateQuery(req, res, date, timeSlot, a_id,'1');
        await updateQuery(req, res, date, timeSlot+1, counter,'2');
      }
      else if (type[0].slot_id == '4') {
        const counter=await counterAppointId(localAppointDate,'3');
        await updateQuery(req, res, date, timeSlot, a_id,'1');
        await updateQuery(req, res, date, timeSlot+1, counter,'2');
      }
      else if (type[0].slot_id == '6') {
        const counter=await counterAppointId(localAppointDate,'5');
        await updateQuery(req, res, date, timeSlot, a_id,'1');
        await updateQuery(req, res, date, timeSlot+1, counter,'2');
      }
      else if (type[0].slot_id == '9') {
        const counter=await counterAppointId(localAppointDate,'8');
        await updateQuery(req, res, date, timeSlot, a_id,'1');
        await updateQuery(req, res, date, timeSlot+1, counter,'2');
      }
    } else {
      await updateQuery(req, res, date, timeSlot, a_id,'2');
    }
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});


//--------------------------package--------------------

app.get('/package', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT package_id AS _id, name, price_inTaka, price_inDollar,duration FROM package');
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching packages:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post('/package', authenticateToken, async (req, res) => {
  const { name, price_inTaka, price_inDollar, duration } = req.body;

  // Log the received data
  

  try {
    const [result] = await pool.query(
      'INSERT INTO package (name, price_inTaka, price_inDollar, duration) VALUES (?, ?, ?, ?)',
      [name, price_inTaka, price_inDollar, duration]
    );

    const insertedPackage = {
      _id: result.insertId,
      name,
      price_inTaka,
      price_inDollar,
      duration
    };
    res.status(201).json(insertedPackage);
  } catch (error) {
    console.error("Error adding package:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});



app.delete("/package/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM package WHERE package_id = ?", [id]);
    res.status(200).json({ message: "Package removed successfully" });
  } catch (error) {
    console.error("Error removing package:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});

//------------------------appointment------------------

app.get("/timeslots", authenticateToken, async (req, res) => {
  const { date } = req.query;
 
  if (!date) {
    return res.status(400).send("Date is required");
  }

  try {
    const [result] = await pool.query(
      `SELECT ts.slot_id, ts.time_slot
       FROM time_slot ts
       LEFT JOIN appointment a ON ts.slot_id = a.slot_id AND a.appoint_date = ?
       LEFT JOIN blocked_schedules bs ON bs.schedule_date = ?
       WHERE a.slot_id IS NULL
         AND (bs.schedule_date IS NULL OR (
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
      [date, date]
    );
  
    res.json(result);
  } catch (error) {
    console.error("Error fetching time slots:", error);
    res.status(500).send("Server error");
  }
});
app.post("/appointment", authenticateToken, async (req, res) => {
 
  const {
    package_id,
    appoint_type,
    appoint_date,
    user_fullname,
    user_phonenum,
    slot_id, // Expecting an array of slot IDs
  } = req.body;

  if (
    !package_id ||
    !appoint_type ||
    !appoint_date ||
    !user_fullname ||
    !user_phonenum ||
    !slot_id
  ) {
    return res.status(400).send("All fields are required and slot_ids should be an array");
  }
  const slot = slot_id.split('');

  try {
    const insertPromises = slot.map((slot_id) => 
      pool.query(
        `INSERT INTO appointment (package_id, appoint_type, appoint_date, user_fullname, user_phonenum, slot_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          parseInt(package_id),
          appoint_type,
          appoint_date,
          user_fullname,
          user_phonenum,
          slot_id,
        ]
      )
    );

    const results = await Promise.all(insertPromises);

    // Combine the results with the input to send back the newly created appointments
    const insertedAppointments = results.map((result, index) => ({
      appointment_id: result.insertId,
      package_id: parseInt(package_id),
      appoint_type,
      appoint_date,
      user_fullname,
      user_phonenum,
      slot_id: slot_id[index],
    }));

    res.status(201).json(insertedAppointments);
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).send("Server error");
  }
});

//-----------------------payment ----------------------

app.get("/payments", authenticateToken, async (req, res) => {
  const { search } = req.query;

  try {
    let result;
    if (search) {
      [result] = await pool.query(
        `
        SELECT 
          a.user_fullname, 
          a.user_phonenum, 
          p.amount, 
          pa.name AS package_name, 
          DATE_FORMAT(p.date, '%d %b, %Y') AS payment_date,
          DATE_FORMAT(p.time, '%h:%i %p') AS payment_time
        FROM 
          payment p
        JOIN 
          appointment a ON a.appointment_id = p.appointment_id
        JOIN 
          package pa ON a.package_id = pa.package_id
        WHERE 
          a.user_fullname LIKE ? OR a.user_phonenum LIKE ?
        ORDER BY 
          p.date DESC, p.time DESC
      `,
        [`%${search}%`, `%${search}%`]
      );
    } else {
      [result] = await pool.query(`
        SELECT 
          a.user_fullname, 
          a.user_phonenum, 
          p.amount, 
          pa.name AS package_name, 
          DATE_FORMAT(p.date, '%d %b, %Y') AS payment_date,
          DATE_FORMAT(p.time, '%h:%i %p') AS payment_time
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

    if (result.length > 0) {
      res.json(result);
    } else {
      res.status(200).json(null);
    }
  } catch (error) {
    console.error("Error fetching payments:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});

//------------------------promotion-------------------------------------

app.get("/getAllAppointment", async (req, res) => {
  try {
    const [result] = await pool.query(
      `SELECT user_fullname, user_phonenum FROM appointment ORDER BY appointment_id ASC`
    );
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/getAllAppoinment", async (req, res) => {
  const [result] =
    await pool.query(`SELECT user_fullname,user_phonenum FROM appointment
ORDER BY appointment_id ASC`);
  
  res.json(result);
});
app.post("/getAllNumbers", async (req, res) => {
  const { fromDate, toDate } = req.body;
  

  try {
    const [result] = await pool.query(
      `SELECT user_fullname, user_phonenum 
       FROM appointment 
       WHERE appoint_date BETWEEN ? AND ?`,
      [fromDate, toDate]
    );
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const { sendBulkSms } = require("./routes/bulkSms");

app.post("/sendBulkSms", async (req, res) => {
  const { sms, message } = req.body;

  if (!sms || !message) {
    return res.status(400).json({ error: "Both sms and message are required" });
  }

  try {
    const result = await sendBulkSms(sms, message);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//-------------------------change pass----------------------

app.post("/changepassword", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  try {
    const [result] = await pool.query(
      "SELECT password FROM admin WHERE id = ?",
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "Admin not found." });
    }

    const user = result[0];

    if (currentPassword !== user.password) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    await pool.query("UPDATE admin SET password = ? WHERE id = ?", [
      newPassword,
      userId,
    ]);

    res.json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

//---------------------------------------------




app.listen(port, () => {
  scheduleAppointmentReminders();
  console.log(`Server running on port ${port}`);
});
/*
https.createServer(credentials, app).listen(port, () => {
  console.log(`Server running on port ${port}`);
});
*/