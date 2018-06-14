const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const whiteListArray = require('./white_list.json');

const { Remessa } = require('./classes/Remessa');
const {
  gravarTitulos,
  pegarTitulosPorPeriodo,
  pegarTitulosValidosEmAberto,
  mudarCampoTitulo,
  deletarTitulo,
  pegarEmpresas,
  gravarEmpresa,
  pegarEmpresaNumero,
  deletarEmpresa,
  deletarSms,
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

app.get('/titulos/aberto', (req, res) => {
  pegarTitulosValidosEmAberto()
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

app.delete('/titulos/:id', (req, res) => {
  const { id } = req.params;
  deletarTitulo(id)
    .then(() => res.sendStatus(204))
    .catch(err => handleInternalError(err, res));
});

app.get('/empresas', (req, res) => {
  pegarEmpresas()
    .then(empresas => res.send(empresas))
    .catch(err => handleInternalError(err, res));
});

app.get('/empresas/:numero', (req, res) => {
  const { numero } = req.params;
  pegarEmpresaNumero(numero)
    .then(empresa => res.send(empresa))
    .catch(err => handleInternalError(err, res));
});

app.put('/empresas/:numero', bodyParser.json(), (req, res) => {
  const { numero } = req.params;
  const { empresa } = req.body;

  gravarEmpresa(numero, empresa)
    .then(() => res.sendStatus(204))
    .catch(err => handleInternalError(err, res));
});

app.delete('/empresas/:numero', (req, res) => {
  const { numero } = req.params;

  deletarEmpresa(numero)
    .then(() => res.sendStatus(201))
    .catch(err => handleInternalError(err, res));
});

app.delete('/sms/:smsId', (req, res) => {
  const { smsId } = req.params;

  deletarSms(smsId)
    .then(() => res.sendStatus(201))
    .catch(err => handleInternalError(err, res));
})

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

module.exports = {
  app,
};

