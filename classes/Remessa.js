const { converteData } = require('../services');
const { Titulo } = require('./Titulo');

class Remessa {
  constructor(buffer) {
    this.stringFile = buffer.toString('utf-8');

    this.defineHeader();
    this.defineTitulos();
    this.defineTitulosEmitente();
  }

  lineByline() {
    if (this.__lines) {
      return this.__lines;
    }
    this.__lines = this.stringFile.replace(/\r/g, '').split('\n');
    return this.__lines;
  }


  defineHeader() {
    const lines = this.lineByline().slice(0, 2);

    const header = {
      codigoBanco: lines[0].slice(0, 3),
      loteServico: lines[0].slice(4, 7),
      dataGeracao: converteData(lines[0].slice(143, 151)),
      numeroRemesa: lines[1].slice(183, 191),
      emitente: {
        id: lines[0].charAt(17) === '1' ? lines[0].slice(21, 32) : lines[0].slice(18, 32),
        nome: lines[0].slice(72, 102).trim(),
      },
      dadosBancarios: {
        agencia: {
          numero: lines[0].slice(52, 57),
          digito: lines[0].charAt(57),
        },
        contaCorrente: {
          numero: lines[0].slice(58, 70),
          digito: lines[0].charAt(70),
        },
      },
    };

    this.header = header;

    return this;
  }

  defineTitulos() {
    const lines = this.lineByline().filter((line) => line.startsWith('00100013'));

    const titulos = [];

    let linhasTitulo;

    lines.forEach((line) => {
      if (line.charAt(13) === 'P') {
        if (linhasTitulo) {
          titulos.push(new Titulo(linhasTitulo));
        }
        linhasTitulo = {
          linhaP: line,
        };
      } else {
        linhasTitulo[`linha${line.charAt(13)}`] = line;
      }
    });

    if (linhasTitulo.linhaP && linhasTitulo.linhaQ) {
      titulos.push(new Titulo(linhasTitulo));
    }

    this.titulos = titulos;

    return this;
  }

  defineTitulosEmitente() {
    const { titulos } = this;

    titulos.forEach((titulo) => {
      titulo.emitente = this.header.emitente; // eslint-disable-line
    });

    return this;
  }

  semLines() {
    const self = { ...this };
    delete self.__lines;
    delete self.stringFile;

    return self;
  }
}

module.exports = {
  Remessa,
};
