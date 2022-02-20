const netPing = require ('net-ping');

const session = netPing.createSession({
  retries: 1,
  timeout: 1_000,
});

function ping(ipAddress) {
  return new Promise((resolve) => {
    session.pingHost(ipAddress, (error, target) => resolve(error));
  });
}

module.exports = ping;
