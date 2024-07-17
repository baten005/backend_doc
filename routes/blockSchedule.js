const express = require('express');
const router = express.Router();
const pool = require('../db/db');


router.get('/blockedSchedules', async (req, res) => {
    try {
        const [result] = await pool.query('SELECT * FROM blocked_schedules');
        res.status(200).json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/blockCells', async (req, res) => {
    const date = req.body.formatedDate;
    const time_slot = req.body.timeSlot;
    console.log(date,time_slot);

    try {
       const res= await pool.query('CALL block_or_unblock_schedule(?, ?)', [date, time_slot]);
       console.log(res)
        await pool.query('CALL delete_empty_schedules');
        res.status(200).json({ message: 'Schedule blocked/unblocked successfully' });
    } catch (error) {
        console.error('Error blocking/unblocking schedule:', error);
        res.status(500).json({ error: 'Failed to block/unblock schedule' });
    }
});

router.post('/blockDay', async (req, res) => {
    const date = req.body.formatedDate;
    console.log(date)

    try {
        await pool.query('CALL block_or_unblock_dayschedule(?)', [date]);
        res.status(200).json({ message: 'Schedule blocked/unblocked successfully' });
    } catch (error) {
        console.error('Error blocking/unblocking schedule:', error);
        res.status(500).json({ error: 'Failed to block/unblock schedule' });
    }
});

router.get('/blockedCells', async(req,res)=>{
    const [response]=await pool.query('SELECT * FROM blocked_schedules ORDER BY id ASC');
    console.log(response)
    res.status(200).json(response);
})
router.post('/unblock', async (req, res) => {
    const { date, time_slot } = req.body;
    try {
        await pool.query('DELETE FROM blocked_schedules WHERE date = ? AND time_slot = ?', [date, time_slot]);
        res.status(200).json({ message: 'Schedule unblocked successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
