const mysql = require('mysql2/promise');


const pool = mysql.createPool({
  connectionLimit: 20, 
  host: '93.127.166.229', 
  user: 'huraira_consultancy', 
  password: 'Baten219135_', 
  database: 'huraira_consultancy', 
  waitForConnections: true,
  queueLimit: 0, 
});


module.exports = {
  query: (sql, values) => {
    return new Promise((resolve, reject) => {
      pool.execute(sql, values, (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });
  },
  pool: pool, 
};
