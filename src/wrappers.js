const fs = require('fs');
// const Datastore = require('@seald-io/nedb');
const netPing = require ('net-ping');
const { fastResolver } = require('dns-fast-resolver');
const ping = require('./ping');
const { DNS_1, DNS_2, ERROR_LOG_PATH } = require('./constants');

if (!fs.existsSync(ERROR_LOG_PATH)) fs.writeFileSync(ERROR_LOG_PATH, '', 'utf8');

// const store = new Datastore({
//   filename: path.join(__dirname, '../', 'log.db'),
//   autoload: true,
// });

function logError(errorMessage) {
  return new Promise((resolve) => {
    fs.appendFile(ERROR_LOG_PATH, `${errorMessage}\n`, (error) => {
      if (error) console.log('Error appending error to logfile.', error);
      resolve();
    });
  });
}

function lookupDNS(domain, family = 4) {
  return new Promise((resolve) => {
    fastResolver(domain, { family }, (err, address, family) => resolve([err, address, family]));
  });
}

async function redundantPing(url) {
  /* Checks URL & 2 backup sites (if URL is down).
  Returns [status, stage, error]
  Status always refers to the url that is passed in.
  Stage and Error refer to where in the steps the function succeeded or failed */
  const [errorDNS, ipAddress] = await lookupDNS(url);
  let checkForInternet = false;

  if (errorDNS) {
    console.log('DNS error', errorDNS);
    return;
  }

  // ------------- Check URL ------------- //
  // If timeout, then check internet. If other error, return early
  const primaryPingError = await ping(ipAddress);
  if (primaryPingError instanceof netPing.RequestTimedOutError) checkForInternet = true;
  else if (primaryPingError) return [null, 'primary', primaryPingError];

  // ---------- Secondary Check ---------- //
  // if secondary or tertiary is up, then that means the site is down. Return false
  if (!checkForInternet) return [true];
  const secondaryPingError = await ping(DNS_1);
  const tertiaryPingError = await ping(DNS_2);

  if (!secondaryPingError) return [false, 'primary', primaryPingError];
  if (!tertiaryPingError) return [false, 'primary', primaryPingError];
  
  return [null, 'tertiary', tertiaryPingError]; // return tertiary error. Even though secondary also failed
}

module.exports = {
  // store,
  logError,
  lookupDNS,
  redundantPing,
};
