const axios = require('axios');
const { authZenvia } = require('./private');

const api = 'https://api-rest.zenvia.com/services';

function authBase64({ login, senha }) {
  const string = `${login}:${senha}`;
  const auth = Buffer.from(string).toString('base64');
  return `Basic ${auth}`;
}

function agendarSms(dados) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-type': 'application/json',
    Accept: 'application/json',
    Authorization: authBase64(authZenvia),
  };

  return axios.post(`${api}/send-sms`, { sendSmsRequest: dados }, { headers });
}

function cancelarAgendamento(id) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    Authorization: authBase64(authZenvia),
  };

  return axios.post(`${api}/cancel-sms/${id}`, {}, { headers });
}

module.exports = {
  agendarSms,
  cancelarAgendamento,
};
