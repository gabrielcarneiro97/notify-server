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

module.exports = {
  gravarTitulos,
};
