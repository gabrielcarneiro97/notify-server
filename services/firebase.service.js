const admin = require('firebase-admin');
const moment = require('moment');

const serviceAccount = require('./apiKey.json');

const { agendarSms, cancelarAgendamento } = require('./zenvia.service');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const DELETE_FIELD = admin.firestore.FieldValue.delete();

const titulosCollection = db.collection('Titulos');

async function gravarTitulos(titulos) {
  return Promise.all(titulos.map(
    async (titulo) => {
      const { id } = titulo;
      const snap = await titulosCollection.doc(id).get();
      if (!snap.data()) {
        await titulosCollection.doc(id).set(titulo);
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


  let query = titulosCollection
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
  const query = titulosCollection
    .where('vencimento.timestamp', '>=', new Date().setHours(0, 0, 0, 0))
    .where('pago', '==', false);

  const snap = await query.get();
  const docs = snap._docs();

  return docs.map((doc) => doc.data());
}

async function deletarSms(id) {
  return new Promise((resolve, reject) => {
    const smsRef = db
      .collection('Sms')
      .doc(id);

    cancelarAgendamento(id)
      .then(() => {
        smsRef
          .get()
          .then((snap) => {
            const sms = snap.data();

            db
              .collection('Titulos')
              .doc(sms.tituloId)
              .update({ smsId: DELETE_FIELD })
              .then(() => {
                smsRef
                  .delete()
                  .then(() => {
                    resolve();
                  }).catch((err) => reject(err));
              })
              .catch((err) => reject(err));
          })
          .catch((err) => reject(err));
      })
      .catch((err) => reject(err));
  });
}

function mudarCampoTitulo(key, field, value) {
  return new Promise((resolve, reject) => {
    const tituloRef = db
      .collection('Titulos')
      .doc(key);

    if (field === 'pago' && value === false) {
      tituloRef
        .get()
        .then((snap) => {
          const titulo = snap.data();
          if (titulo.smsId) {
            deletarSms(titulo.smsId)
              .catch((err) => reject(err));
          }
        })
        .catch((err) => reject(err));
    }

    tituloRef
      .update({ [field]: value })
      .then((snap) => resolve(snap))
      .catch((err) => reject(err));
  });
}

function deletarTitulo(id) {
  return new Promise((resolve, reject) => {
    const tituloRef = db
      .collection('Titulos')
      .doc(id);

    tituloRef
      .get()
      .then((snap) => {
        const titulo = snap.data();

        if (titulo.smsId) {
          deletarSms(titulo.smsId)
            .catch((err) => reject(err));
        }

        tituloRef
          .delete()
          .then(() => resolve())
          .catch((err) => reject(err));
      })
      .catch((err) => reject(err));
  });
}

function pegarClientes() {
  return new Promise((resolve, reject) => {
    db
      .collection('Clientes')
      .get()
      .then((snap) => {
        const snapDocs = snap._docs();
        const docs = [];

        snapDocs.forEach((doc) => {
          docs.push(doc.data());
        });
        resolve(docs);
      })
      .catch((err) => reject(err));
  });
}


function pegarClienteNumero(numero) {
  return new Promise((resolve, reject) => {
    db
      .collection('Clientes')
      .doc(numero)
      .get()
      .then((snap) => resolve(snap.data()))
      .catch((err) => reject(err));
  });
}

function pegarClienteId(id) {
  return new Promise((resolve, reject) => {
    db
      .collection('Clientes')
      .where('id', '==', id)
      .get()
      .then((snap) => resolve(snap._docs()[0].data()))
      .catch((err) => reject(err));
  });
}


function gravarCliente(numero, dados) {
  return new Promise((resolve, reject) => {
    db
      .collection('Clientes')
      .doc(numero)
      .set(dados)
      .then(() => resolve())
      .catch((err) => reject(err));
  });
}

function deletarCliente(numero) {
  return new Promise((resolve, reject) => {
    db
      .collection('Clientes')
      .doc(numero)
      .delete()
      .then(() => resolve())
      .catch((err) => reject(err));
  });
}

function pegarSmsAgendados() {
  return new Promise((resolve, reject) => {
    db
      .collection('Sms')
      .where('dataEnvio.timestamp', '>=', new Date().getTime())
      .get()
      .then((snap) => {
        const snapDocs = snap._docs();
        const docs = [];

        snapDocs.forEach((doc) => {
          docs.push(doc.data());
        });
        resolve(docs);
      })
      .catch((err) => reject(err));
  });
}

function novoSms(titulo) {
  return new Promise((resolve, reject) => {
    const tituloId = titulo.id;

    pegarClienteId(titulo.pagador.id)
      .then((cliente) => {
        const destinatario = `55${cliente.telefone}`;
        const horaEnvio = titulo.vencimento.timestamp - 50400000;

        const mensagem = `.\nBOLETO: ${titulo.numeroDocumento};\nPAG: ${cliente.nome}\nREF: ${titulo.mensagem};\nVALOR: R$${titulo.valorLiquido};\nVENC: ${moment(titulo.vencimento.timestamp).format('DD/MM/YY')}.\nQualquer dúvida entrar em contato.\nCaso o título já tenha sido pago, desconsidere.`;

        const sms = {
          destinatario: cliente,
          dataEnvio: {
            timestamp: horaEnvio,
            data: new Date(horaEnvio).toISOString(),
          },
          mensagem,
          tituloId,
        };

        db
          .collection('Sms')
          .add(sms)
          .then((snap) => {
            const smsId = snap.id;

            const zenviaData = {
              from: 'ANDREA CONTABILIDADE',
              to: destinatario,
              schedule: new Date(horaEnvio).toISOString(),
              id: smsId,
              aggregateId: '33590',
              msg: mensagem,
            };

            agendarSms(zenviaData)
              .then(() => {
                mudarCampoTitulo(tituloId, 'smsId', smsId)
                  .then(() => resolve({ smsId, sms }))
                  .catch((err) => reject(err));
              });
          })
          .catch((err) => reject(err));
      })
      .catch((err) => reject(err));
  });
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
