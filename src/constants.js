const path = require('path');

const DNS_1 = '1.1.1.1'; // cloudflare
const DNS_2 = '8.8.8.8'; // google
const ERROR_LOG_PATH = path.join(__dirname, '../', 'error.log');

module.exports = {
  DNS_1,
  DNS_2,
  ERROR_LOG_PATH,
};
