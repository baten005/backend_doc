const axios = require('axios');

const API_TOKEN = 'qwzjlhex-m6lqubry-p73s8mzd-aevyiaqb-ioti2hvw'; 
const SID = 'TEAMHURAIRAOTP'; 
const DOMAIN = 'http://smsplus.sslwireless.com'; 

const sendBulkSms = async (msisdns, message) => {
  const csmsId = Math.random().toString(36).substr(2, 9); 

  const url = `${DOMAIN}/api/v3/send-sms`;

  try {
    const requests = msisdns.map(msisdn => {
      const normalizedMsisdn = msisdn.replace(/,/g, ' ');

      return axios.post(`${url}?api_token=${API_TOKEN}&sid=${SID}&msisdn=${encodeURIComponent(normalizedMsisdn)}&sms=${encodeURIComponent(message)}&csms_id=${csmsId}`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
      });
    });

    const responses = await Promise.all(requests);

    responses.forEach((response, index) => {
      console.log(`SMS sent to ${msisdns[index]}:`, response.data);
    });

    return responses.map(response => response.data);
  } catch (error) {
    if (error.response) {
      console.error('Response error:', error.response.data);
      throw new Error(`Error sending bulk SMS: ${error.response.data.error_message || error.message}`);
    } else if (error.request) {
      console.error('Request error:', error.request);
      throw new Error('Error sending bulk SMS: No response received from the server');
    } else {
      console.error('Setup error:', error.message);
      throw new Error(`Error sending bulk SMS: ${error.message}`);
    }
  }
};

module.exports = { sendBulkSms };
