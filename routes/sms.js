const axios = require('axios');

const API_TOKEN = 'qwzjlhex-m6lqubry-p73s8mzd-aevyiaqb-ioti2hvw'; // put ssl provided api_token here
const SID = 'TEAMHURAIRAOTP'; // put ssl provided sid here
const DOMAIN = 'http://smsplus.sslwireless.com'; // api domain // example http://smsplus.sslwireless.com

const sendSingleSms = async (msisdn, messageBody, csmsId) => {
  console.log(msisdn, messageBody, csmsId);
  const url = `${DOMAIN}/api/v3/send-sms`;

  try {
    const response = await axios.post(`${url}?api_token=${API_TOKEN}&sid=${SID}&msisdn=${msisdn}&sms=${messageBody}&csms_id=${csmsId}`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Response error:', error.response.data);
      throw new Error(`Error sending SMS: ${error.response.data.error_message || error.message}`);
    } else if (error.request) {
      console.error('Request error:', error.request);
      throw new Error('Error sending SMS: No response received from the server');
    } else {
      console.error('Setup error:', error.message);
      throw new Error(`Error sending SMS: ${error.message}`);
    }
  }
};

module.exports = { sendSingleSms };
