const fs = require('fs');
const axios = require('axios');

const file = fs.readFileSync('./clientes.txt', 'utf8');

const arr = file.split('\n');

const clientes = [];

arr.forEach((line) => {
  const dados = line.split('|');

  const cliente = {
    numero: dados[0],
    nome: dados[1],
    id: dados[2],
    telefone: dados[4],
  };

  clientes.push(cliente);
});

clientes.forEach((cliente) => {
  axios
    .put(`http://localhost:8080/clientes/${cliente.numero}`, { cliente })
    .then(() => console.log(`Cliente ${cliente.numero} OK!`))
    .catch(() => console.log(`Cliente ${cliente.numero} ERRO!`));
});
