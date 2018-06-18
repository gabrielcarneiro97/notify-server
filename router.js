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
  pegarClientes,
  gravarCliente,
  pegarClienteNumero,
  deletarCliente,
  pegarSmsAgendados,
  novoSms,
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

app.put('/titulos/:id', bodyParser.json(), (req, res) => {
  const { id } = req.params;
  const { pago } = req.query;

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

app.get('/clientes', (req, res) => {
  pegarClientes()
    .then(clientes => res.send(clientes))
    .catch(err => handleInternalError(err, res));
});

app.get('/clietes/:numero', (req, res) => {
  const { numero } = req.params;
  pegarClienteNumero(numero)
    .then(cliente => res.send(cliente))
    .catch(err => handleInternalError(err, res));
});

app.put('/clientes/:numero', bodyParser.json(), (req, res) => {
  const { numero } = req.params;
  const { cliente } = req.body;

  gravarCliente(numero, cliente)
    .then(() => res.sendStatus(204))
    .catch(err => handleInternalError(err, res));
});

app.delete('/clientes/:numero', (req, res) => {
  const { numero } = req.params;

  deletarCliente(numero)
    .then(() => res.sendStatus(201))
    .catch(err => handleInternalError(err, res));
});

app.post('/sms', bodyParser.json(), (req, res) => {
  const { titulo } = req.body;

  novoSms(titulo)
    .then(data => res.send(data))
    .catch(err => handleInternalError(err, res));
});

app.delete('/sms/:smsId', (req, res) => {
  const { smsId } = req.params;

  deletarSms(smsId)
    .then(() => res.sendStatus(201))
    .catch(err => handleInternalError(err, res));
});

app.get('/sms/agendados', (req, res) => {
  pegarSmsAgendados()
    .then(docs => res.send(docs))
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

app.get('/hello', (req, res) => {
  res.send('hi');
});

module.exports = {
  app,
};

