const admin = require('firebase-admin');

const serviceAccount = require('./apiKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

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

  console.log(inicio, fim);

  return new Promise((resolve, reject) => {
    let query = titulosCollection
      .where('vencimento.timestamp', '>=', inicio)
      .where('vencimento.timestamp', '<=', fim);

    if (soPagos) {
      console.log('aqui');
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

module.exports = {
  db,
  gravarTitulos,
  pegarTitulosPorPeriodo,
  mudarCampoTitulo,
  deletarTitulo,
};
