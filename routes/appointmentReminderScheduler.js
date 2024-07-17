// appointmentReminderScheduler.js
const { sendBulkSms } = require("./bulkSms");
const pool = require("../db/db");
const moment = require("moment-timezone");

// Function to send SMS to users with appointments today at 8 AM Bangladesh time
const sendAppointmentReminders = async () => {
  try {
    // Get today's date in Bangladesh timezone
    const today = moment().tz("Asia/Dhaka").format("YYYY-MM-DD");

    // Query appointments for today with time slots
    const result = await pool.query(
      `SELECT a.user_phonenum, ts.time_slot
       FROM public.appointment a
       INNER JOIN public.time_slot ts ON a.slot_id = ts.slot_id
       WHERE a.appoint_date = $1`,
      [today]
    );

    if (result.rows.length === 0) {
      console.log("No appointments found for today.");
      return;
    }
    const messages = result.rows.map(row => {
        const { user_phonenum, time_slot } = row;
        
        // Extract start time from time_slot (assuming time_slot format is "start_time - end_time")
        const startTime = time_slot.split(' - ')[0];
  
        return {
          phoneNumber: user_phonenum,
          message: `Your appointment is scheduled for ${startTime} today. Please be on time.`
        };
      });
    console.log(messages);
    await Promise.all(
      messages.map((msg) => sendBulkSms([msg.phoneNumber], msg.message))
    );

    console.log("Appointment reminders sent successfully.");
  } catch (error) {
    console.error("Error sending appointment reminders:", error.message);
    throw new Error("Failed to send appointment reminders.");
  }
};

const scheduleAppointmentReminders = () => {
  const now = moment().tz("Asia/Dhaka");
  const eightAM = now.clone().startOf("day").hour(16);

  if (now.isAfter(eightAM)) {
    eightAM.add(1, "day");
  }

  const delay = eightAM.diff(now);

  setTimeout(() => {
    sendAppointmentReminders();
    setInterval(sendAppointmentReminders,24*60*60* 1000);
  }, delay);
};

module.exports = { scheduleAppointmentReminders };
