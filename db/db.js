const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://cpl_pstu:XkcTPal2nF9DNm8G1UJKnlv4dhxlwg1U@dpg-cp3q9f7sc6pc73fu2n8g-a.oregon-postgres.render.com/cpl_pstu',
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
