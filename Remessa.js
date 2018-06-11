function converteData(string) {
  const dia = string.slice(0, 2);
  const mes = string.slice(2, 4);
  const ano = string.slice(4, 8);
  return new Date(ano, parseInt(mes, 10) - 1, dia);
}

function converteValor(string) {
  const int = string.slice(0, 13);
  const float = string.slice(string.length - 2, string.length);
  return parseFloat(`${int}.${float}`);
}

class Titulo {
  constructor({ linhaP, linhaQ, linhaR }) {
    this.pago = false;

    this.valorBruto = converteValor(linhaP.slice(85, 100));
    this.desconto = converteValor(linhaP.slice(180, 195));
    this.valorLiquido = this.valorBruto - this.desconto;

    this.vencimento = converteData(linhaP.slice(77, 85));
    this.emissao = converteData(linhaP.slice(109, 117));
    this.id = linhaP.slice(37, 57).trim();

    this.pagador = {
      id: linhaQ.charAt(17) === '1' ? linhaQ.slice(21, 33) : linhaQ.slice(18, 33),
      nome: linhaQ.slice(33, 73).trim(),
    };

    this.menssagem = linhaR.slice(99, 139).trim();
  }
}

class Remessa {
  constructor(buffer) {
    this.buffer = buffer;

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
    const lines = this.lineByline().filter(line => line.startsWith('00100013'));

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
}

module.exports = {
  Remessa,
};
