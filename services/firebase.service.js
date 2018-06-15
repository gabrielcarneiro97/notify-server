const admin = require('firebase-admin');
const moment = require('moment');

const serviceAccount = require('./apiKey.json');

const { agendarSms, cancelarAgendamento } = require('./zenvia.service');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const DELETE_FIELD = admin.firestore.FieldValue.delete();

function gravarTitulos(titulos) {
  const titulosCollection = db.collection('Titulos');

  const promises = [];

  for (let i = 0; i < titulos.length; i += 1) {
    const titulo = titulos[i];
    const getPromise = titulosCollection.doc(titulo.id).get();
    promises.push(getPromise);

    getPromise.then((snap) => {
      if (!snap.data()) {
        titulosCollection.doc(titulo.id).set(titulo);
      }
    });
  }

  return new Promise((resolve, reject) => {
    Promise
      .all(promises)
      .then(() => resolve())
      .catch(err => reject(err));
  });
}

function pegarTitulosPorPeriodo(dados) {
  const titulosCollection = db.collection('Titulos');
  let {
    inicio, fim, soPagos, soEmAberto,
  } = dados;
  const { empresaCnpj } = dados;

  inicio = parseInt(inicio, 10);
  fim = parseInt(fim, 10);
  soPagos = soPagos === 'true';
  soEmAberto = soEmAberto === 'true';

  return new Promise((resolve, reject) => {
    let query = titulosCollection
      .where('vencimento.timestamp', '>=', inicio)
      .where('vencimento.timestamp', '<=', fim);

    if (soPagos) {
      query = query.where('pago', '==', true);
    }

    if (soEmAberto) {
      query = query.where('pago', '==', false);
    }

    if (empresaCnpj) {
      query = query.where('pagante.id', '==', empresaCnpj);
    }

    query
      .get()
      .then((snap) => {
        const snapDocs = snap._docs();
        const docs = [];

        snapDocs.forEach((doc) => {
          docs.push(doc.data());
        });
        resolve(docs);
      })
      .catch(err => reject(err));
  });
}

function pegarTitulosValidosEmAberto() {
  const titulosCollection = db.collection('Titulos');

  return new Promise((resolve, reject) => {
    titulosCollection
      .where('vencimento.timestamp', '>=', new Date().setHours(0, 0, 0, 0))
      .where('pago', '==', false)
      .get()
      .then((snap) => {
        const snapDocs = snap._docs();
        const docs = [];

        snapDocs.forEach((doc) => {
          docs.push(doc.data());
        });
        resolve(docs);
      })
      .catch(err => reject(err));
  });
}

function mudarCampoTitulo(key, field, value) {
  return new Promise((resolve, reject) => {
    db
      .collection('Titulos')
      .doc(key)
      .update({ [field]: value })
      .then(snap => resolve(snap))
      .catch(err => reject(err));
  });
}

function deletarTitulo(id) {
  return new Promise((resolve, reject) => {
    db
      .collection('Titulos')
      .doc(id)
      .delete()
      .then(() => resolve())
      .catch(err => reject(err));
  });
}

function pegarEmpresas() {
  return new Promise((resolve, reject) => {
    db
      .collection('Empresas')
      .get()
      .then((snap) => {
        const snapDocs = snap._docs();
        const docs = [];

        snapDocs.forEach((doc) => {
          docs.push(doc.data());
        });
        resolve(docs);
      })
      .catch(err => reject(err));
  });
}


function pegarEmpresaNumero(numero) {
  return new Promise((resolve, reject) => {
    db
      .collection('Empresas')
      .doc(numero)
      .get()
      .then(snap => resolve(snap.data()))
      .catch(err => reject(err));
  });
}

function pegarEmpresaCnpj(cnpj) {
  return new Promise((resolve, reject) => {
    db
      .collection('Empresas')
      .where('cnpj', '==', cnpj)
      .get()
      .then(snap => resolve(snap._docs()[0].data()))
      .catch(err => reject(err));
  });
}


function gravarEmpresa(numero, dados) {
  return new Promise((resolve, reject) => {
    db
      .collection('Empresas')
      .doc(numero)
      .set(dados)
      .then(() => resolve())
      .catch(err => reject(err));
  });
}

function deletarEmpresa(numero) {
  return new Promise((resolve, reject) => {
    db
      .collection('Empresas')
      .doc(numero)
      .delete()
      .then(() => resolve())
      .catch(err => reject(err));
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
      .catch(err => reject(err));
  });
}

function novoSms(titulo) {
  return new Promise((resolve, reject) => {
    const tituloId = titulo.id;

    pegarEmpresaCnpj(titulo.pagador.id)
      .then((empresa) => {
        const destinatario = `55${empresa.telefone}`;
        const horaEnvio = titulo.vencimento.timestamp - 50400000;

        const mensagem =
        `.\nBOLETO: ${titulo.numeroDocumento};\nREF: ${titulo.mensagem};\nVALOR: R$${titulo.valorLiquido};\nVENC: ${moment(titulo.vencimento.timestamp).format('DD/MM/YY')}.\nQualquer dúvida entrar em contato.`;

        const sms = {
          destinatario: empresa,
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
                  .then(() => resolve(smsId, sms))
                  .catch(err => reject(err));
              });
          })
          .catch(err => reject(err));
      })
      .catch(err => reject(err));
  });
}

function deletarSms(id) {
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

            mudarCampoTitulo(sms.tituloId, 'smsId', DELETE_FIELD)
              .then(() => {
                smsRef
                  .delete()
                  .then(() => {
                    resolve();
                  }).catch(err => reject(err));
              })
              .catch(err => reject(err));
          })
          .catch(err => reject(err));
      })
      .catch(err => reject(err));
  });
}

module.exports = {
  db,
  gravarTitulos,
  pegarTitulosPorPeriodo,
  pegarTitulosValidosEmAberto,
  mudarCampoTitulo,
  deletarTitulo,
  pegarEmpresas,
  gravarEmpresa,
  deletarEmpresa,
  pegarEmpresaNumero,
  pegarSmsAgendados,
  novoSms,
  deletarSms,
};
