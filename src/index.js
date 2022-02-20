// const CronJob = require('cron').CronJob;
const { logError, lookupDNS, redundantPing } = require('./wrappers');

async function main() {
  const date = new Date().toISOString();
  const [isUp, stage, error] = await redundantPing('1.2.3.4');
  console.log('isUp:', isUp, stage, error);

  // Site is down. Internet is up
  if (isUp === true) return;
  if (isUp === false) {
    console.log('site is down. Internet is up');
    return;
  }

  // Issue with pinging all 3 sources
  let errorMessage = `${date} ${stage}: ${error}`
  console.log(errorMessage);
  logError(errorMessage);
}

main();
