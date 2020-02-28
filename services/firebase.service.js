const admin = require('firebase-admin');
const moment = require('moment');

const serviceAccount = require('./apiKey.json');

const { agendarSms, cancelarAgendamento } = require('./zenvia.service');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const DELETE_FIELD = admin.firestore.FieldValue.delete();

const titulosCol = db.collection('Titulos');
const smsCol = db.collection('Sms');
const clientesCol = db.collection('Clientes');

async function gravarTitulos(titulos) {
  return Promise.all(titulos.map(
    async (titulo) => {
      const { id } = titulo;
      const snap = await titulosCol.doc(id).get();
      if (!snap.data()) {
        await titulosCol.doc(id).set(titulo);
      }
    },
  ));
}

async function pegarTitulosPorPeriodo(dados) {
  let {
    inicio, fim, soPagos, soEmAberto,
  } = dados;
  const { clienteId } = dados;

  inicio = parseInt(inicio, 10);
  fim = parseInt(fim, 10);
  soPagos = soPagos === 'true';
  soEmAberto = soEmAberto === 'true';


  let query = titulosCol
    .where('vencimento.timestamp', '>=', inicio)
    .where('vencimento.timestamp', '<=', fim);

  if (soPagos) {
    query = query.where('pago', '==', true);
  }

  if (soEmAberto) {
    query = query.where('pago', '==', false);
  }

  if (clienteId) {
    query = query.where('pagante.id', '==', clienteId);
  }

  const snap = await query.get();
  const docs = snap._docs();

  return docs.map((doc) => doc.data());
}

async function pegarTitulosValidosEmAberto() {
  const query = titulosCol
    .where('vencimento.timestamp', '>=', new Date().setHours(0, 0, 0, 0))
    .where('pago', '==', false);

  const snap = await query.get();
  const docs = snap._docs();

  return docs.map((doc) => doc.data());
}

async function deletarSms(id) {
  const smsRef = smsCol.doc(id);
  await cancelarAgendamento(id);

  const smsSnap = await smsRef.get();
  const sms = smsSnap.data();

  await titulosCol.doc(sms.tituloId).update({ smsId: DELETE_FIELD });
  await smsRef.delete();
}

async function mudarCampoTitulo(id, field, value) {
  const tituloRef = titulosCol.doc(id);

  if (field === 'pago' && value === false) {
    const snap = await tituloRef.get();
    const titulo = snap.data();
    if (titulo.smsId) await deletarSms(titulo.smsId);
  }

  return tituloRef.update({ [field]: value });
}

async function deletarTitulo(id) {
  const tituloRef = titulosCol.doc(id);
  const snap = await tituloRef.get();

  const titulo = snap.data();

  if (titulo.smsId) await deletarSms(titulo.smsId);

  return tituloRef.delete();
}

async function pegarClientes() {
  const snap = await clientesCol.get();
  const docs = snap._docs();
  return docs.map((doc) => doc.data());
}


async function pegarClienteNumero(numero) {
  const snap = await clientesCol.doc(numero).get();
  return snap.data();
}

async function pegarClienteId(id) {
  const snap = await clientesCol.where('id', '==', id).get();
  return snap._docs()[0].data();
}


async function gravarCliente(numero, dados) {
  return clientesCol.doc(numero).set(dados);
}

async function deletarCliente(numero) {
  return clientesCol.doc(numero).delete();
}

async function pegarSmsAgendados() {
  const snap = await smsCol
    .where('dataEnvio.timestamp', '>=', new Date().getTime())
    .get();

  const docs = snap._docs();

  return docs.map((doc) => doc.data());
}

async function novoSms(titulo) {
  const tituloId = titulo.id;

  const cliente = await pegarClienteId(titulo.pagador.id);

  const destinatario = `55${cliente.telefone}`;
  const horaEnvio = titulo.vencimento.timestamp - 50400000;
  const mensagem = `.
  BOLETO: ${titulo.numeroDocumento};
  PAG: ${cliente.nome}
  REF: ${titulo.mensagem};
  VALOR: R$${titulo.valorLiquido};
  VENC: ${moment(titulo.vencimento.timestamp).format('DD/MM/YY')}.
  Qualquer dúvida entrar em contato.
  Caso o título já tenha sido pago, desconsidere.`;

  const sms = {
    destinatario: cliente,
    dataEnvio: {
      timestamp: horaEnvio,
      data: new Date(horaEnvio).toISOString(),
    },
    mensagem,
    tituloId,
  };

  const snap = await smsCol.add(sms);

  const smsId = snap.id;

  const zenviaData = {
    from: 'ANDREA CONTABILIDADE',
    to: destinatario,
    schedule: new Date(horaEnvio).toISOString(),
    id: smsId,
    aggregateId: '33590',
    msg: mensagem,
  };

  await agendarSms(zenviaData);
  await mudarCampoTitulo(tituloId, 'smsId', smsId);


  return { smsId, sms };
}

module.exports = {
  db,
  gravarTitulos,
  pegarTitulosPorPeriodo,
  pegarTitulosValidosEmAberto,
  mudarCampoTitulo,
  deletarTitulo,
  pegarClientes,
  gravarCliente,
  deletarCliente,
  pegarClienteNumero,
  pegarSmsAgendados,
  novoSms,
  deletarSms,
};
