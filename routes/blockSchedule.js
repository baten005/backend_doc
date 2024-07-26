const express = require("express");
const router = express.Router();
const { pool } = require("../db/db");

router.get("/blockedCells", async (req, res) => {
  try {
    const [result] = await pool.query(
      "SELECT * FROM blocked_schedules ORDER BY id ASC"
    );
    //console.log('Blocked cells:', result);
    res.status(200).json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/blockCells", async (req, res) => {
  const date = req.body.formatedDate;
  const time_slot = req.body.timeSlot;
  console.log(date, time_slot);
  const time_slot_map = {
    "9:00 AM - 10:00 AM": "time_slot1",
    "10:15 AM - 11:15 AM": "time_slot2",
    "11:30 AM - 12:30 PM": "time_slot3",
    "12:45 PM - 1:45 PM": "time_slot4",
    "2:00 PM - 3:00 PM": "time_slot5",
    "3:15 PM - 4:15 PM": "time_slot6",
    "4:30 PM - 5:30 PM": "time_slot7",
    "7:00 PM - 8:00 PM": "time_slot8",
    "8:15 PM - 9:15 PM": "time_slot9",
  };
  console.log(time_slot_map[time_slot]);
  try {
    const [det] = await pool.query(
      `SELECT ${time_slot_map[time_slot]} FROM blocked_schedules WHERE schedule_date = ?`,
      [date]
    );
    if (det.length > 0) {
      console.log(det[0][time_slot_map[time_slot]]);
      if (det[0][time_slot_map[time_slot]] == "1") {
        await pool.query(
          `
      UPDATE blocked_schedules SET ${time_slot_map[time_slot]}='0' WHERE schedule_date=?
      `,
          [date]
        );
      } else {
        await pool.query(
          `
      UPDATE blocked_schedules SET ${time_slot_map[time_slot]}='1' WHERE schedule_date=?
      `,
          [date]
        );
      }
    } else {
      await pool.query(
        `INSERT INTO blocked_schedules (schedule_date, time_slot1, time_slot2, time_slot3, time_slot4, time_slot5, time_slot6, time_slot7, time_slot8, time_slot9)
    VALUES (?, '0', '0', '0', '0', '0', '0', '0', '0', '0');
    `,
        [date]
      );
      await pool.query(
        `
    UPDATE blocked_schedules SET ${time_slot_map[time_slot]}='1' WHERE schedule_date=?
    `,
        [date]
      );
    }
    await pool.query(`DELETE FROM blocked_schedules
    WHERE time_slot1 = '0' AND time_slot2 = '0' AND time_slot3 = '0' AND 
          time_slot4 = '0' AND time_slot5 = '0' AND time_slot6 = '0' AND 
          time_slot7 = '0' AND time_slot8 = '0' AND time_slot9 = '0'`);
    res
      .status(200)
      .json({ message: "Schedule blocked/unblocked successfully" });
  } catch (error) {
    console.error("Error blocking/unblocking schedule:", error);
    res.status(500).json({ error: "Failed to block/unblock schedule" });
  }
});

router.post("/blockDay", async (req, res) => {
  const date = req.body.formatedDate;
  console.log(date);
  let ones = [];
  let zeros = [];
  let arr = [];
  try {
    const [should_block] = await pool.query(
      `SELECT  time_slot1,time_slot2,time_slot3,time_slot4,time_slot5,time_slot6,time_slot7,time_slot8,time_slot9 
      FROM blocked_schedules WHERE schedule_date = ?`,
      [date]
    );
    console.log("should block: ", should_block[0]);

    console.log(ones, zeros);

    /////////////////////////////////////////////////////////////////////////////

    if (should_block.length > 0) {
      if (should_block[0].time_slot1 == "1") {
        ones.push(should_block[0].time_slot1);
      } else {
        zeros.push(should_block[0].time_slot1);
      }
      if (should_block[0].time_slot2 == "1") {
        ones.push(should_block[0].time_slot2);
      } else {
        zeros.push(should_block[0].time_slot2);
      }
      if (should_block[0].time_slot3 == "1") {
        ones.push(should_block[0].time_slot3);
      } else {
        zeros.push(should_block[0].time_slot3);
      }
      if (should_block[0].time_slot4 == "1") {
        ones.push(should_block[0].time_slot4);
      } else {
        zeros.push(should_block[0].time_slot4);
      }
      if (should_block[0].time_slot5 == "1") {
        ones.push(should_block[0].time_slot5);
      } else {
        zeros.push(should_block[0].time_slot5);
      }
      if (should_block[0].time_slot6 == "1") {
        ones.push(should_block[0].time_slot6);
      } else {
        zeros.push(should_block[0].time_slot6);
      }
      if (should_block[0].time_slot7 == "1") {
        ones.push(should_block[0].time_slot7);
      } else {
        zeros.push(should_block[0].time_slot7);
      }
      if (should_block[0].time_slot8 == "1") {
        ones.push(should_block[0].time_slot8);
      } else {
        zeros.push(should_block[0].time_slot8);
      }
      if (should_block[0].time_slot9 == "1") {
        ones.push(should_block[0].time_slot9);
      } else {
        zeros.push(should_block[0].time_slot9);
      }
      if (ones.length > 0 && ones.length < 9) {
        await pool.query(
          ` UPDATE blocked_schedules
    SET
        time_slot1 = '1',
        time_slot2 = '1',
        time_slot3 = '1',
        time_slot4 = '1',
        time_slot5 = '1',
        time_slot6 = '1',
        time_slot7 = '1',
        time_slot8 = '1',
        time_slot9 = '1'
    WHERE schedule_date = ?`,
          [date]
        );
      } else if (ones.length == 9) {
        await pool.query(
          ` Delete From blocked_schedules where schedule_date = ?`,
          [date]
        );
      }
    } else {
      await pool.query(
        `INSERT INTO blocked_schedules (schedule_date, time_slot1, time_slot2, time_slot3, time_slot4, time_slot5, time_slot6, time_slot7, time_slot8, time_slot9)
    VALUES (?, '1', '1', '1', '1', '1', '1', '1', '1', '1')`,
        [date]
      );
    }

    //////////////////////////////////////////////////////////////////////////////

    res
      .status(200)
      .json({ message: "Schedule blocked/unblocked successfully" });
  } catch (error) {
    console.error("Error blocking/unblocking schedule:", error);
    res.status(500).json({ error: "Failed to block/unblock schedule" });
  }
});



router.post("/unblock", async (req, res) => {
  const { date, time_slot } = req.body;

  try {
    await pool.query(
      "DELETE FROM blocked_schedules WHERE date = ? AND time_slot = ?",
      [date, time_slot]
    );
    res.status(200).json({ message: "Schedule unblocked successfully" });
  } catch (error) {
    console.error("Error unblocking schedule:", error);
    res.status(500).json({ error: "Failed to unblock schedule" });
  }
});

module.exports = router;
