const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const whiteListArray = require('./white_list.json');

const { Remessa } = require('./classes/Remessa');
const {
  gravarTitulos,
  pegarTitulosPorPeriodo,
  mudarCampoTitulo,
  deletarTitulo,
} = require('./services');

const app = express();
const upload = multer();

app.options('*', cors());
app.use(cors());

function handleInternalError(err, res) {
  console.error(err);
  res.sendStatus(500);
}

app.post('/titulos', bodyParser.json(), (req, res) => {
  const titulos = req.body;

  gravarTitulos(titulos).then(() => {
    res.sendStatus(201);
  });
});

app.get('/titulos/periodo', (req, res) => {
  const dados = req.query;

  pegarTitulosPorPeriodo(dados)
    .then(titulos => res.send(titulos))
    .catch(err => handleInternalError(err, res));
});

app.put('/titulos', bodyParser.json(), (req, res) => {
  const { id, pago } = req.query;

  const pagoBool = pago === 'true';

  mudarCampoTitulo(id, 'pago', pagoBool)
    .then(() => res.sendStatus(204))
    .catch(err => handleInternalError(err, res));
});

app.delete('/titulos', (req, res) => {
  const { id } = req.query;
  deletarTitulo(id)
    .then(() => res.sendStatus(204))
    .catch(err => handleInternalError(err, res));
});

app.post('/file', upload.single('file'), (req, res) => {
  const { file } = req;
  const { accept } = req.query;

  if (accept === '.REM') {
    const rem = new Remessa(file.buffer);
    res.send(rem.semLines());
  }
});

app.get('/whitelist', (req, res) => {
  const { email } = req.query;
  if (whiteListArray.includes(email)) {
    res.sendStatus(204);
  } else {
    res.sendStatus(401);
  }
});

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
