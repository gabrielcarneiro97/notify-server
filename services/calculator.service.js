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

module.exports = {
  converteValor,
  converteData,
};
