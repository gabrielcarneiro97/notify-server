const fs = require('fs');

function converteData(string) {
  const dia = string.slice(0, 2);
  const mes = string.slice(2, 4);
  const ano = string.slice(4, 8);
  return new Date(ano, parseInt(mes, 10) - 1, dia);
}

class Movimento {

}

class Remessa {
  constructor(buffer) {
    this.buffer = buffer;

    this.stringFile = buffer.toString('utf-8');

    this.header = this.defineHeader();
  }

  lineByline() {
    return this.stringFile.replace(/\r/g, '').split('\n');
  }
  defineHeader() {
    const lines = this.lineByline().slice(0, 2);

    const header = {
      codigoBanco: lines[0].slice(0, 3),
      loteServico: lines[0].slice(4, 7),
      cpf: lines[0].slice(17, 18) === '1' ? lines[0].slice(21, 32) : undefined,
      cnpj: lines[0].slice(17, 18) === '2' ? lines[0].slice(18, 32) : undefined,
      nome: lines[0].slice(72, 102),
      dataGeracao: converteData(lines[0].slice(143, 151)),
      numeroRemesa: lines[1].slice(183, 191),
      dadosBancarios: {
        agencia: {
          numero: lines[0].slice(52, 57),
          digito: lines[0].slice(57, 58),
        },
        contaCorrente: {
          numero: lines[0].slice(58, 70),
          digito: lines[0].slice(70, 71),
        },
      },
    };

    return header;
  }
}

const rem = new Remessa(fs.readFileSync('./CNAB240_1630_32135_050418_268.REM'));
rem.defineHeader();
