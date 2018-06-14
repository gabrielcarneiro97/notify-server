const { converteData, converteValor } = require('../services');

class Titulo {
  constructor({ linhaP, linhaQ, linhaR }) {
    this.pago = false;

    this.valorBruto = converteValor(linhaP.slice(85, 100));
    this.desconto = converteValor(linhaP.slice(180, 195));
    this.valorLiquido = this.valorBruto - this.desconto;

    this.vencimento = {
      data: converteData(linhaP.slice(77, 85)),
      timestamp: converteData(linhaP.slice(77, 85)).getTime(),
    };
    this.emissao = {
      data: converteData(linhaP.slice(109, 117)),
      timestamp: converteData(linhaP.slice(109, 117)).getTime(),
    };
    this.id = linhaP.slice(37, 57).trim();
    this.numeroDocumento = linhaP.slice(62, 77).trim();

    this.pagador = {
      id: linhaQ.charAt(17) === '1' ? linhaQ.slice(22, 33) : linhaQ.slice(18, 33),
      nome: linhaQ.slice(33, 73).trim(),
    };

    this.menssagem = linhaR.slice(99, 139).trim();
  }
}

module.exports = {
  Titulo,
};
