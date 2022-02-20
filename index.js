const fs = require('fs');
const dns = require('dns');
const path = require('path');
// const Datastore = require('@seald-io/nedb');
const netPing = require ('net-ping');
const { fastResolver } = require('dns-fast-resolver');
// const CronJob = require('cron').CronJob;

const DNS_1 = '1.1.1.1'; // cloudflare
const DNS_2 = '8.8.8.8'; // google
const ERROR_LOG_PATH = path.join(__dirname, 'error.log');

if (!fs.existsSync(ERROR_LOG_PATH)) fs.writeFileSync(ERROR_LOG_PATH, '', 'utf8');

// --------------------------------- Utils ---------------------------------- //

// const store = new Datastore({
//   filename: path.join(__dirname, 'log.db'),
//   autoload: true,
// });

const session = netPing.createSession({
  retries: 1,
  timeout: 1_000,
});

function logError(errorMessage) {
  return new Promise((resolve) => {
    fs.appendFile(ERROR_LOG_PATH, `${errorMessage}\n`, (error) => {
      if (error) console.log('Error appending error to logfile.', error);
      resolve();
    });
  });
}

function ping(ipAddress) {
  return new Promise((resolve) => {
    session.pingHost(ipAddress, (error, target) => resolve(error));
  });
}

function lookupDNS(domain, family = 4) {
  return new Promise((resolve) => {
    fastResolver(domain, { family }, (err, address, family) => resolve([err, address, family]));
  });
}

// -------------------------------------------------------------------------- //

// hardenedPing
// checks URL & 2 backup sites (if URL is down).
async function redundantPing(url) {
  const [errorDNS, ipAddress] = await lookupDNS(url);
  let urlTimedOut = false;
  if (errorDNS) return console.log('DNS error', errorDNS);

  // --------- Check URL --------- //
  // if timeout, then check internet
  // if other error, return null. Cant do anything else
  const primaryPingError = await ping(ipAddress);
  if (primaryPingError instanceof netPing.RequestTimedOutError)
    urlTimedOut = true;
  else if (primaryPingError)
    return [primaryPingError, null]; // return null if error, but error isn't timeout

  // ------ Did it Succeed? ------ //
  // check if we should do an internet check.
  // if we dont need to, then URL is considered up!
  if (urlTimedOut === false) 
    return [undefined, true];

  // ------ Secondary Check ------ //
  // const secondaryPingError = await ping('1.2.3.4');
  // const tertiaryPingError = await ping('1.2.3.4');
  const secondaryPingError = await ping(DNS_1);
  const tertiaryPingError = await ping(DNS_2);

  // ----- Did that Succeed? ----- //
  // if secondary or tertiary is up, then that means the site is down. Return false
  if (!secondaryPingError || !tertiaryPingError)
    return [primaryPingError, false];

  // ------ Faulty Network ------- //
  return [secondaryPingError || tertiaryPingError, null];
}

// 
async function main() {
  const [error, isUp] = await redundantPing('1.2.3.4');
  console.log('isUp', error, isUp);

  // Site is down. Internet is up
  if (isUp === false) {
    console.log('site is down. Internet is up')
  }

  // guard. If all is good, dont do anything else
  else if (isUp === true) return;

  // Ping Error
  let errorMessage = new Date().toISOString();
  if (error instanceof netPing.RequestTimedOutError) {
    errorMessage += ` Error: Could not ping secondary and/or tertiary ip addresses. ${error}`;      
  } else {
    errorMessage += ` Error: Generic error in ping. ${error}`;
  }

  console.log(errorMessage);
  logError(errorMessage);
}

main();

  // const pingError = await ping('1.2.3.4');
  // if (pingError instanceof netPing.RequestTimedOutError) {
  //   console.log('timeout');
  // } else if (pingError) {
  //   console.log('generic error', pingError);
  // }