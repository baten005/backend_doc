const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// Route to get blocked schedules
router.get('/blockedSchedules', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM blocked_schedules');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Route to block a schedule
router.post('/blockCells', async (req, res) => {
    const date = req.body.formatedDate;
    const time_slot=req.body.timeSlot
   console.log(date,time_slot)
   try {
    await pool.query('SELECT block_or_unblock_schedule($1, $2)', [date, time_slot]);
    await pool.query('SELECT Delete_if_all_slots_zero()')
    res.status(200).json({ message: 'Schedule blocked/unblocked successfully' });
    
} catch (error) {
    console.error('Error blocking/unblocking schedule:', error);
    res.status(500).json({ error: 'Failed to block/unblock schedule' });
}
});
router.post('/blockDay', async (req, res) => {
    const date = req.body.formatedDate;
    
   console.log('date',date)
   try {
    await pool.query('SELECT block_or_unblock_dayschedule($1)', [date]);
    res.status(200).json({ message: 'Schedule blocked/unblocked successfully' });
} catch (error) {
    console.error('Error blocking/unblocking schedule:', error);
    res.status(500).json({ error: 'Failed to block/unblock schedule' });
}
});

router.get('/blockedCells', async(req,res)=>{
    const response=await pool.query('SELECT * FROM public.blocked_schedules ORDER BY id ASC');
    res.status(200).json(response.rows);
})
router.post('/unblock', async (req, res) => {
    const { date, time_slot } = req.body;
    try {
        await pool.query('DELETE FROM blocked_schedules WHERE date = $1 AND time_slot = $2', [date, time_slot]);
        res.status(200).json({ message: 'Schedule unblocked successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
