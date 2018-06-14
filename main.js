const { CronJob } = require('cron');
const { app } = require('./router');

if (process.argv[2] === 'ssl') {
  // https.createServer(SSL, app).listen(8080, () => {
  //   console.log('SSL server listening 8080 port');
  // });
} else {
  const server = app.listen(8080, () => {
    const { address, port } = server.address();
    console.log(`App listening at http://${address}:${port}`);
  });
}

const job = new CronJob('00 00 10 * * *', () => {
  console.log('You will see this message every minute');
}, null, true, 'America/Sao_Paulo');
