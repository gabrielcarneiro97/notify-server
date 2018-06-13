const { db } = require('./services');

const inicio = 1522597872277;
const fim =  1523375472277;

db
  .collection('Titulos')
  .where('vencimento.timestamp', '>=', inicio)
  .where('vencimento.timestamp', '<=', fim)
  .where('pago', '==', true)
  .get()
  .then((snap) => {
    const snapDocs = snap._docs();
    const docs = [];

    snapDocs.forEach((doc) => {
      docs.push(doc.data());
    });
    console.log(docs);
  });
