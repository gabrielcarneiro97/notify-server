const https = require('https');
const { app } = require('./router');
const { SSL } = require('./services');

if (process.argv[2] === 'ssl') {
  console.log(SSL);
  https.createServer(SSL, app).listen(8080, () => {
    console.log('SSL server listening 8181 port');
  });
} else {
  const server = app.listen(8080, () => {
    const { address, port } = server.address();
    console.log(`App listening at http://${address}:${port}`);
  });
}
