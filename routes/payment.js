const express = require("express");

const router = express.Router();
const path = require("path");
const pool = require('../db/db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const SSLCommerzPayment = require("sslcommerz-lts");

const JWT_SECRET = 'your_jwt_secret_key';
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

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

const store_id = "kaka6601420c5bc3d";
const store_passwd = "kaka6601420c5bc3d@ssl";
const is_live = false;

router.get('/payment', verifyToken, (req, res) => {
    const encodedData = req.query.data;
    if (true) {
        return res.status(404).send('Up Coming');
    }

    const formData = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf8'));
    const pno = req.phoneNumber;
    console.log(formData, pno);

    const successUrl = `https://backend.hurairaconsultancy.com/success?data=${encodeURIComponent(JSON.stringify(formData))}&pno=${pno}`;

    const data = {
        total_amount: 100,
        currency: 'BDT',
        tran_id: 'REF123',
        success_url: successUrl,
        fail_url: 'https://backend.hurairaconsultancy.com/fail',
        cancel_url: 'https://backend.hurairaconsultancy.com/cancel',
        ipn_url: 'https://backend.hurairaconsultancy.com/ipn',
        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: 'Customer Name',
        cus_email: 'customer@example.com',
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    sslcz.init(data).then(apiResponse => {
        let GatewayPageURL = apiResponse.GatewayPageURL;
        console.log('Redirecting to: ', GatewayPageURL);
        res.json(GatewayPageURL);
    });
});

router.post("/success", async function (req, res) {
    const formData = req.query.data ? JSON.parse(decodeURIComponent(req.query.data)) : null;
    const phoneNumber = '+'+req.query.pno;
    

    if (!formData || !phoneNumber) {
        return res.status(400).send('Missing data');
    }

    const { fullName, selectedTimeSlot, selectedAppointmentType, selectedDate, counsellingType } = formData;
    console.log('dddddddddddddd',fullName, selectedTimeSlot, selectedAppointmentType, selectedDate, counsellingType,phoneNumber.replace(' ',''))
    try {
        const result = await pool.query(
            `INSERT INTO appointment (package_id, appoint_type, appoint_date, user_fullname, user_phonenum, slot_id)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [parseInt(counsellingType), selectedAppointmentType, selectedDate, fullName, phoneNumber.replace(' ',''), selectedTimeSlot] 
        );
        res.redirect('https://www.hurairaconsultancy.com/booking');
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).send('Server error');
    }
   
    
});

router.post("/fail", async function (req, res) {
    console.log('fail');
    res.redirect('https://www.hurairaconsultancy.com/booking');
});
router.post("/cancel", async function (req, res) {
    console.log('fail');
    res.redirect('https://www.hurairaconsultancy.com/booking');
});



module.exports = router;
