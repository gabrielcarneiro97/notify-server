const https = require('https');
const { app } = require('./router');
const { SSL } = require('./services');

if (process.argv[2] === 'ssl') {
  https.createServer(SSL, app).listen(8181, () => {
    console.log('SSL server listening 8181 port');
  });
} else {
  const server = app.listen(8181, () => {
    const { address, port } = server.address();
    console.log(`App listening at http://${address}:${port}`);
  });
}
