"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type LanguageId = "pseudocode" | "python" | "javascript" | "typescript" | "java" | "sql" | "html" | "css" | "markdown";
type Test = { args: unknown[]; expected: unknown };
type Lesson = {
  id: string;
  title: string;
  level: string;
  statement: string;
  concept: string;
  logicSteps: string[];
  functionName: string;
  tests: Test[];
};
type Message = { role: "tutor" | "student"; text: string };
type RunResult = { ok: boolean; lines: string[] };

const languages: { id: LanguageId; label: string; group: string; extension: string; executable: boolean }[] = [
  { id: "pseudocode", label: "Lógica pura", group: "Raciocínio", extension: "alg", executable: true },
  { id: "python", label: "Python", group: "Programação", extension: "py", executable: true },
  { id: "javascript", label: "JavaScript", group: "Programação", extension: "js", executable: true },
  { id: "typescript", label: "TypeScript", group: "Programação", extension: "ts", executable: true },
  { id: "java", label: "Java", group: "Programação", extension: "java", executable: true },
  { id: "sql", label: "SQL", group: "Dados", extension: "sql", executable: false },
  { id: "html", label: "HTML", group: "Web", extension: "html", executable: false },
  { id: "css", label: "CSS", group: "Web", extension: "css", executable: false },
  { id: "markdown", label: "Markdown", group: "Documentação", extension: "md", executable: false },
];

const lessons: Lesson[] = [
  {
    id: "double", title: "O dobro de um número", level: "Fundamentos",
    statement: "Receba um número e devolva esse valor multiplicado por 2.", concept: "entrada, transformação e saída",
    logicSteps: ["Receber o número", "Multiplicar por 2", "Devolver o resultado"], functionName: "dobro",
    tests: [{ args: [3], expected: 6 }, { args: [0], expected: 0 }, { args: [-4], expected: -8 }],
  },
  {
    id: "even", title: "É par ou ímpar?", level: "Condições",
    statement: "Receba um número e informe se ele é par. O resultado deve ser verdadeiro ou falso.", concept: "comparação, decisão e resto da divisão",
    logicSteps: ["Receber o número", "Calcular o resto por 2", "Comparar o resto com zero"], functionName: "ehPar",
    tests: [{ args: [8], expected: true }, { args: [7], expected: false }, { args: [0], expected: true }],
  },
  {
    id: "larger", title: "Qual é o maior?", level: "Condições",
    statement: "Receba dois números e devolva o maior. Se forem iguais, devolva qualquer um deles.", concept: "comparação e caminhos alternativos",
    logicSteps: ["Receber dois valores", "Comparar o primeiro com o segundo", "Devolver o maior"], functionName: "maior",
    tests: [{ args: [9, 4], expected: 9 }, { args: [2, 7], expected: 7 }, { args: [5, 5], expected: 5 }],
  },
  {
    id: "table", title: "Tabuada curta", level: "Repetições",
    statement: "Receba um número e devolva uma lista com as multiplicações de 1 até 5.", concept: "repetição, contador e lista",
    logicSteps: ["Criar uma lista vazia", "Repetir de 1 até 5", "Guardar cada multiplicação"], functionName: "tabuada",
    tests: [{ args: [2], expected: [2, 4, 6, 8, 10] }, { args: [0], expected: [0, 0, 0, 0, 0] }],
  },
  {
    id: "sum", title: "Somando uma lista", level: "Repetições",
    statement: "Receba uma lista de números, percorra os itens e devolva a soma total.", concept: "acumulador, lista e repetição",
    logicSteps: ["Começar o total em zero", "Percorrer cada número", "Somar ao total e devolver"], functionName: "somar",
    tests: [{ args: [[1, 2, 3]], expected: 6 }, { args: [[]], expected: 0 }, { args: [[10, -3, 2]], expected: 9 }],
  },
  {
    id: "sign", title: "Positivo, negativo ou zero", level: "Condições",
    statement: "Receba um número e classifique-o como positivo, negativo ou zero.", concept: "múltiplas decisões e ordem das condições",
    logicSteps: ["Receber o número", "Comparar com zero", "Devolver a classificação"], functionName: "classificarNumero",
    tests: [{ args: [8], expected: "positivo" }, { args: [-3], expected: "negativo" }, { args: [0], expected: "zero" }],
  },
  {
    id: "vote", title: "Pode votar?", level: "Condições",
    statement: "Receba uma idade e informe se a pessoa já pode votar, considerando a idade mínima de 16 anos.", concept: "regra de negócio e comparação",
    logicSteps: ["Receber a idade", "Comparar com 16", "Devolver verdadeiro ou falso"], functionName: "podeVotar",
    tests: [{ args: [16], expected: true }, { args: [15], expected: false }, { args: [30], expected: true }],
  },
  {
    id: "average", title: "Média de três notas", level: "Condições",
    statement: "Calcule a média de três notas e devolva Aprovado quando ela for 7 ou mais; caso contrário, devolva Reprovado.", concept: "cálculo, variável intermediária e decisão",
    logicSteps: ["Calcular a média", "Comparar a média com 7", "Devolver a situação"], functionName: "verificarAprovacao",
    tests: [{ args: [8, 7, 9], expected: "Aprovado" }, { args: [5, 6, 4], expected: "Reprovado" }, { args: [7, 7, 7], expected: "Aprovado" }],
  },
  {
    id: "discount", title: "Desconto na compra", level: "Condições",
    statement: "Compras de 100 ou mais recebem 10% de desconto. Devolva o valor final da compra.", concept: "porcentagem, condição e valor final",
    logicSteps: ["Receber o valor", "Verificar se chega a 100", "Aplicar o desconto ou manter o valor"], functionName: "calcularCompra",
    tests: [{ args: [200], expected: 180 }, { args: [80], expected: 80 }, { args: [100], expected: 90 }],
  },
  {
    id: "sumEven", title: "Somar somente os pares", level: "Repetições",
    statement: "Receba uma lista de números e devolva a soma apenas dos valores pares.", concept: "repetição, filtro e acumulador",
    logicSteps: ["Percorrer os números", "Verificar quais são pares", "Somar apenas os pares"], functionName: "somarPares",
    tests: [{ args: [[1, 2, 3, 4]], expected: 6 }, { args: [[1, 3, 5]], expected: 0 }, { args: [[10, -2, 7]], expected: 8 }],
  },
];

const snippets: Record<string, Record<LanguageId, { starter: string; example: string; hint: string }>> = {
  double: {
    pseudocode: { starter: "FUNÇÃO dobro(numero)\n  // escreva o passo principal\n  \nFIM FUNÇÃO", example: "FUNÇÃO triplo(numero)\n  RETORNE numero * 3\nFIM FUNÇÃO", hint: "Use RETORNE e multiplique numero por 2." },
    python: { starter: "def dobro(numero):\n    # escreva o passo principal\n    pass", example: "def triplo(numero):\n    return numero * 3", hint: "Em Python, use return numero * 2." },
    javascript: { starter: "function dobro(numero) {\n  // escreva o passo principal\n  \n}", example: "function triplo(numero) {\n  return numero * 3;\n}", hint: "Use return numero * 2;" },
    typescript: { starter: "function dobro(numero: number): number {\n  // escreva o passo principal\n  \n}", example: "function triplo(numero: number): number {\n  return numero * 3;\n}", hint: "O tipo já está pronto; use return numero * 2;" },
    java: { starter: "class Solucao {\n  static int dobro(int numero) {\n    // escreva o passo principal\n    \n  }\n}", example: "class Exemplo {\n  static int triplo(int numero) {\n    return numero * 3;\n  }\n}", hint: "Dentro do método, use return numero * 2;" },
    sql: { starter: "-- tabela: numeros(valor)\nSELECT\n  -- calcule o dobro e dê o nome dobro\nFROM numeros;", example: "SELECT valor, valor * 3 AS triplo\nFROM numeros;", hint: "Selecione valor * 2 AS dobro." },
    html: { starter: "<!-- HTML organiza conteúdo, não calcula o dobro -->\n<ol class=\"passos\">\n  <!-- escreva os 3 passos da lógica -->\n</ol>", example: "<ol>\n  <li>Receber o número</li>\n  <li>Multiplicar por 3</li>\n  <li>Mostrar o resultado</li>\n</ol>", hint: "Use três elementos <li> dentro de <ol>." },
    css: { starter: "/* CSS apresenta visualmente; não executa o cálculo */\n.passo {\n  /* destaque cada passo */\n}", example: ".passo {\n  padding: 12px;\n  border-left: 3px solid green;\n}", hint: "Experimente padding, cor e uma borda para destacar os passos." },
    markdown: { starter: "## Lógica do dobro\n\n<!-- descreva os 3 passos em uma lista numerada -->", example: "## Lógica do triplo\n\n1. Receber o número\n2. Multiplicar por 3\n3. Mostrar o resultado", hint: "Crie uma lista numerada de 1 a 3." },
  },
  even: {
    pseudocode: { starter: "FUNÇÃO ehPar(numero)\n  // compare o resto com zero\n  \nFIM FUNÇÃO", example: "FUNÇÃO ehPositivo(numero)\n  RETORNE numero > 0\nFIM FUNÇÃO", hint: "RETORNE numero % 2 = 0." },
    python: { starter: "def ehPar(numero):\n    # compare o resto com zero\n    pass", example: "def ehPositivo(numero):\n    return numero > 0", hint: "Use return numero % 2 == 0." },
    javascript: { starter: "function ehPar(numero) {\n  // compare o resto com zero\n  \n}", example: "function ehPositivo(numero) {\n  return numero > 0;\n}", hint: "Use return numero % 2 === 0;" },
    typescript: { starter: "function ehPar(numero: number): boolean {\n  // compare o resto com zero\n  \n}", example: "function ehPositivo(numero: number): boolean {\n  return numero > 0;\n}", hint: "Use return numero % 2 === 0;" },
    java: { starter: "class Solucao {\n  static boolean ehPar(int numero) {\n    // compare o resto com zero\n    \n  }\n}", example: "class Exemplo {\n  static boolean ehPositivo(int numero) {\n    return numero > 0;\n  }\n}", hint: "Use return numero % 2 == 0;" },
    sql: { starter: "-- tabela: numeros(valor)\nSELECT valor\nFROM numeros\nWHERE -- condição para valores pares;", example: "SELECT valor FROM numeros\nWHERE valor > 0;", hint: "Use valor % 2 = 0 na cláusula WHERE." },
    html: { starter: "<section>\n  <!-- apresente os caminhos PAR e ÍMPAR -->\n</section>", example: "<section>\n  <h2>Decisão</h2>\n  <p>Positivo ou não positivo</p>\n</section>", hint: "Use títulos ou parágrafos para mostrar os dois caminhos." },
    css: { starter: ".par { /* estilo do caminho verdadeiro */ }\n.impar { /* estilo do caminho falso */ }", example: ".positivo { color: green; }\n.negativo { color: red; }", hint: "Use cores diferentes nas classes .par e .impar." },
    markdown: { starter: "## Decisão par ou ímpar\n\n- Se ...\n- Senão ...", example: "## Decisão\n\n- Se for maior que zero: positivo\n- Senão: não positivo", hint: "Complete as duas possibilidades da decisão." },
  },
  larger: {
    pseudocode: { starter: "FUNÇÃO maior(a, b)\n  SE a > b ENTÃO\n    // caminho 1\n  SENÃO\n    // caminho 2\n  FIM SE\nFIM FUNÇÃO", example: "FUNÇÃO menor(a, b)\n  SE a < b ENTÃO RETORNE a\n  SENÃO RETORNE b\nFIM FUNÇÃO", hint: "Retorne a no primeiro caminho e b no segundo." },
    python: { starter: "def maior(a, b):\n    if a > b:\n        # caminho 1\n        pass\n    # caminho 2", example: "def menor(a, b):\n    if a < b:\n        return a\n    return b", hint: "Retorne a dentro do if e b depois dele." },
    javascript: { starter: "function maior(a, b) {\n  if (a > b) {\n    // caminho 1\n  }\n  // caminho 2\n}", example: "function menor(a, b) {\n  if (a < b) return a;\n  return b;\n}", hint: "Use return a dentro do if e return b depois." },
    typescript: { starter: "function maior(a: number, b: number): number {\n  if (a > b) {\n    // caminho 1\n  }\n  // caminho 2\n}", example: "function menor(a: number, b: number): number {\n  if (a < b) return a;\n  return b;\n}", hint: "Use return a dentro do if e return b depois." },
    java: { starter: "class Solucao {\n  static int maior(int a, int b) {\n    if (a > b) {\n      // caminho 1\n    }\n    // caminho 2\n  }\n}", example: "static int menor(int a, int b) {\n  if (a < b) return a;\n  return b;\n}", hint: "Use return a dentro do if e return b depois." },
    sql: { starter: "-- tabela: numeros(valor)\nSELECT -- função que encontra o maior valor\nFROM numeros;", example: "SELECT MIN(valor) AS menor\nFROM numeros;", hint: "Use MAX(valor) AS maior." },
    html: { starter: "<div class=\"comparacao\">\n  <!-- represente os dois valores e o maior -->\n</div>", example: "<div><span>3</span><strong>menor</strong><span>8</span></div>", hint: "Use dois <span> e um <strong> para o resultado." },
    css: { starter: ".maior {\n  /* faça o maior valor se destacar */\n}", example: ".menor { opacity: .6; }", hint: "Aumente font-size e font-weight em .maior." },
    markdown: { starter: "## Comparação\n\n| Valor A | Valor B | Maior |\n|---|---|---|\n| 9 | 4 | ? |", example: "| A | B | Menor |\n|---|---|---|\n| 3 | 8 | 3 |", hint: "Complete a tabela e explique a comparação." },
  },
  table: {
    pseudocode: { starter: "FUNÇÃO tabuada(numero)\n  resultados <- LISTA VAZIA\n  PARA i DE 1 ATÉ 5\n    // guarde a multiplicação\n  FIM PARA\n  RETORNE resultados\nFIM FUNÇÃO", example: "PARA i DE 1 ATÉ 3\n  MOSTRE i\nFIM PARA", hint: "Adicione numero * i em resultados a cada repetição." },
    python: { starter: "def tabuada(numero):\n    resultados = []\n    for i in range(1, 6):\n        # guarde a multiplicação\n        pass\n    return resultados", example: "valores = []\nfor i in range(1, 4):\n    valores.append(i)", hint: "Use resultados.append(numero * i)." },
    javascript: { starter: "function tabuada(numero) {\n  const resultados = [];\n  for (let i = 1; i <= 5; i++) {\n    // guarde a multiplicação\n  }\n  return resultados;\n}", example: "const valores = [];\nfor (let i = 1; i <= 3; i++) {\n  valores.push(i);\n}", hint: "Use resultados.push(numero * i);" },
    typescript: { starter: "function tabuada(numero: number): number[] {\n  const resultados: number[] = [];\n  for (let i = 1; i <= 5; i++) {\n    // guarde a multiplicação\n  }\n  return resultados;\n}", example: "const valores: number[] = [];\nfor (let i = 1; i <= 3; i++) valores.push(i);", hint: "Use resultados.push(numero * i);" },
    java: { starter: "class Solucao {\n  static int[] tabuada(int numero) {\n    int[] resultados = new int[5];\n    for (int i = 1; i <= 5; i++) {\n      // guarde na posição i - 1\n    }\n    return resultados;\n  }\n}", example: "int[] valores = new int[3];\nfor (int i = 0; i < 3; i++) valores[i] = i + 1;", hint: "Use resultados[i - 1] = numero * i;" },
    sql: { starter: "-- tabela: multiplicadores(valor), com valores de 1 a 5\nSELECT\n  -- multiplique cada valor por 2\nFROM multiplicadores;", example: "SELECT valor, valor * 3 AS resultado\nFROM multiplicadores;", hint: "Use valor * 2 AS resultado." },
    html: { starter: "<table>\n  <!-- monte linhas para 2 × 1 até 2 × 5 -->\n</table>", example: "<table><tr><td>3 × 1</td><td>3</td></tr></table>", hint: "Cada <tr> representa uma repetição da tabuada." },
    css: { starter: ".tabuada { /* organize as linhas */ }\n.tabuada__linha { /* destaque cada resultado */ }", example: ".lista { display: grid; gap: 8px; }", hint: "Use display: grid e gap para organizar a repetição visual." },
    markdown: { starter: "## Tabuada do 2\n\n<!-- escreva os cinco resultados em lista -->", example: "- 3 × 1 = 3\n- 3 × 2 = 6", hint: "Crie cinco itens começando com '-'." },
  },
  sum: {
    pseudocode: { starter: "FUNÇÃO somar(numeros)\n  total <- 0\n  PARA CADA numero EM numeros\n    // atualize o acumulador\n  FIM PARA\n  RETORNE total\nFIM FUNÇÃO", example: "total <- 0\nPARA CADA valor EM valores\n  total <- total + valor\nFIM PARA", hint: "Atualize total com total + numero." },
    python: { starter: "def somar(numeros):\n    total = 0\n    for numero in numeros:\n        # atualize o acumulador\n        pass\n    return total", example: "total = 0\nfor valor in valores:\n    total = total + valor", hint: "Use total = total + numero." },
    javascript: { starter: "function somar(numeros) {\n  let total = 0;\n  for (const numero of numeros) {\n    // atualize o acumulador\n  }\n  return total;\n}", example: "let total = 0;\nfor (const valor of valores) total = total + valor;", hint: "Use total = total + numero;" },
    typescript: { starter: "function somar(numeros: number[]): number {\n  let total = 0;\n  for (const numero of numeros) {\n    // atualize o acumulador\n  }\n  return total;\n}", example: "let total: number = 0;\nfor (const valor of valores) total += valor;", hint: "Use total = total + numero;" },
    java: { starter: "class Solucao {\n  static int somar(int[] numeros) {\n    int total = 0;\n    for (int numero : numeros) {\n      // atualize o acumulador\n    }\n    return total;\n  }\n}", example: "int total = 0;\nfor (int valor : valores) total = total + valor;", hint: "Use total = total + numero;" },
    sql: { starter: "-- tabela: numeros(valor)\nSELECT -- some todos os valores e chame de total\nFROM numeros;", example: "SELECT AVG(valor) AS media\nFROM numeros;", hint: "Use SUM(valor) AS total." },
    html: { starter: "<ul class=\"valores\">\n  <!-- mostre os valores -->\n</ul>\n<strong>Total: <!-- resultado --></strong>", example: "<ul><li>1</li><li>2</li></ul><strong>Total: 3</strong>", hint: "Liste os valores e mostre o total em <strong>." },
    css: { starter: ".valores { /* organize os itens */ }\n.total { /* destaque o acumulado */ }", example: ".total { font-weight: 700; border-top: 1px solid; }", hint: "Destaque .total com peso, cor ou borda." },
    markdown: { starter: "## Soma\n\n- Valores: 1, 2, 3\n- Total: **?**", example: "- Valores: 2, 4\n- Total: **6**", hint: "Calcule o resultado e substitua o ponto de interrogação." },
  },
  sign: {
    pseudocode: { starter: "FUNÇÃO classificarNumero(numero)\n  SE numero > 0 ENTÃO RETORNE \"positivo\"\n  // verifique o caminho negativo\n  \n  RETORNE \"zero\"\nFIM FUNÇÃO", example: "SE temperatura > 30 ENTÃO RETORNE \"quente\"\nRETORNE \"amena\"", hint: "Depois do primeiro teste, verifique se numero < 0 e retorne \"negativo\"." },
    python: { starter: "def classificarNumero(numero):\n    if numero > 0:\n        return \"positivo\"\n    # verifique o caminho negativo\n    pass\n    return \"zero\"", example: "def clima(temperatura):\n    if temperatura > 30:\n        return \"quente\"\n    return \"ameno\"", hint: "Use if numero < 0: e retorne \"negativo\"." },
    javascript: { starter: "function classificarNumero(numero) {\n  if (numero > 0) return \"positivo\";\n  // verifique o caminho negativo\n  \n  return \"zero\";\n}", example: "function clima(temperatura) {\n  if (temperatura > 30) return \"quente\";\n  return \"ameno\";\n}", hint: "Teste numero < 0 e retorne \"negativo\"." },
    typescript: { starter: "function classificarNumero(numero: number): string {\n  if (numero > 0) return \"positivo\";\n  // verifique o caminho negativo\n  \n  return \"zero\";\n}", example: "function clima(temperatura: number): string {\n  if (temperatura > 30) return \"quente\";\n  return \"ameno\";\n}", hint: "Teste numero < 0 e retorne \"negativo\"." },
    java: { starter: "class Solucao {\n  static String classificarNumero(int numero) {\n    if (numero > 0) return \"positivo\";\n    // verifique o caminho negativo\n    \n    return \"zero\";\n  }\n}", example: "static String clima(int temperatura) {\n  if (temperatura > 30) return \"quente\";\n  return \"ameno\";\n}", hint: "Teste numero < 0 e retorne \"negativo\"." },
    sql: { starter: "SELECT valor,\n  CASE\n    WHEN valor > 0 THEN 'positivo'\n    -- complete o caminho negativo\n    ELSE 'zero'\n  END AS classificacao\nFROM numeros;", example: "CASE WHEN idade >= 18 THEN 'adulto' ELSE 'menor' END", hint: "Adicione WHEN valor < 0 THEN 'negativo'." },
    html: { starter: "<section class=\"classificacao\">\n  <!-- mostre positivo, negativo e zero -->\n</section>", example: "<section><p>Quente</p><p>Ameno</p></section>", hint: "Crie três parágrafos para os resultados possíveis." },
    css: { starter: ".positivo { /* destaque */ }\n.negativo { /* destaque */ }\n.zero { /* destaque */ }", example: ".quente { color: orange; }\n.ameno { color: blue; }", hint: "Use uma cor ou peso diferente para cada classe." },
    markdown: { starter: "## Classificação\n\n- Se for maior que zero: ...\n- Se for menor que zero: ...\n- Caso contrário: ...", example: "- Acima de 30: quente\n- Caso contrário: ameno", hint: "Complete os três caminhos da decisão." },
  },
  vote: {
    pseudocode: { starter: "FUNÇÃO podeVotar(idade)\n  // compare a idade com o limite\n  \nFIM FUNÇÃO", example: "FUNÇÃO podeEntrar(idade)\n  RETORNE idade >= 18\nFIM FUNÇÃO", hint: "RETORNE idade >= 16." },
    python: { starter: "def podeVotar(idade):\n    # compare a idade com o limite\n    pass", example: "def podeEntrar(idade):\n    return idade >= 18", hint: "Use return idade >= 16." },
    javascript: { starter: "function podeVotar(idade) {\n  // compare a idade com o limite\n  \n}", example: "function podeEntrar(idade) {\n  return idade >= 18;\n}", hint: "Use return idade >= 16;" },
    typescript: { starter: "function podeVotar(idade: number): boolean {\n  // compare a idade com o limite\n  \n}", example: "function podeEntrar(idade: number): boolean {\n  return idade >= 18;\n}", hint: "Use return idade >= 16;" },
    java: { starter: "class Solucao {\n  static boolean podeVotar(int idade) {\n    // compare a idade com o limite\n    \n  }\n}", example: "static boolean podeEntrar(int idade) {\n  return idade >= 18;\n}", hint: "Use return idade >= 16;" },
    sql: { starter: "SELECT nome, idade\nFROM pessoas\nWHERE -- condição para quem pode votar;", example: "SELECT nome FROM pessoas WHERE idade >= 18;", hint: "Use idade >= 16." },
    html: { starter: "<section>\n  <!-- apresente os caminhos PODE VOTAR e AINDA NÃO -->\n</section>", example: "<section><p>Entrada permitida</p></section>", hint: "Mostre os dois resultados possíveis em parágrafos." },
    css: { starter: ".pode-votar { /* estado permitido */ }\n.nao-pode { /* estado bloqueado */ }", example: ".permitido { color: green; }", hint: "Crie uma diferença visual entre os dois estados." },
    markdown: { starter: "## Regra para votar\n\n- Se a idade for ...\n- Caso contrário ...", example: "- Se tiver 18 ou mais: pode entrar", hint: "Descreva a comparação com 16." },
  },
  average: {
    pseudocode: { starter: "FUNÇÃO verificarAprovacao(nota1, nota2, nota3)\n  media <- (nota1 + nota2 + nota3) / 3\n  // compare a média com 7\n  \nFIM FUNÇÃO", example: "media <- (valor1 + valor2) / 2\nSE media >= 5 ENTÃO RETORNE \"ok\"\nRETORNE \"rever\"", hint: "Se media >= 7, retorne \"Aprovado\"; depois retorne \"Reprovado\"." },
    python: { starter: "def verificarAprovacao(nota1, nota2, nota3):\n    media = (nota1 + nota2 + nota3) / 3\n    # compare a média com 7\n    pass", example: "media = (valor1 + valor2) / 2\nif media >= 5:\n    return \"ok\"\nreturn \"rever\"", hint: "Use if media >= 7, retorne \"Aprovado\" e, no outro caminho, \"Reprovado\"." },
    javascript: { starter: "function verificarAprovacao(nota1, nota2, nota3) {\n  const media = (nota1 + nota2 + nota3) / 3;\n  // compare a média com 7\n  \n}", example: "const media = (valor1 + valor2) / 2;\nif (media >= 5) return \"ok\";\nreturn \"rever\";", hint: "Compare media >= 7 e retorne as duas situações." },
    typescript: { starter: "function verificarAprovacao(nota1: number, nota2: number, nota3: number): string {\n  const media = (nota1 + nota2 + nota3) / 3;\n  // compare a média com 7\n  \n}", example: "const media: number = (valor1 + valor2) / 2;\nif (media >= 5) return \"ok\";\nreturn \"rever\";", hint: "Compare media >= 7 e retorne as duas situações." },
    java: { starter: "class Solucao {\n  static String verificarAprovacao(int nota1, int nota2, int nota3) {\n    double media = (nota1 + nota2 + nota3) / 3.0;\n    // compare a média com 7\n    \n  }\n}", example: "double media = (valor1 + valor2) / 2.0;\nif (media >= 5) return \"ok\";\nreturn \"rever\";", hint: "Compare media >= 7 e retorne \"Aprovado\" ou \"Reprovado\"." },
    sql: { starter: "SELECT aluno,\n  (nota1 + nota2 + nota3) / 3.0 AS media\n  -- classifique a situação\nFROM notas;", example: "CASE WHEN media >= 5 THEN 'ok' ELSE 'rever' END", hint: "Use CASE para comparar a média com 7." },
    html: { starter: "<table>\n  <!-- apresente notas, média e situação -->\n</table>", example: "<table><tr><td>Média</td><td>8</td></tr></table>", hint: "Use uma linha para notas e outra para o resultado." },
    css: { starter: ".aprovado { /* resultado positivo */ }\n.reprovado { /* resultado de atenção */ }", example: ".ok { font-weight: 700; }", hint: "Destaque visualmente as duas situações." },
    markdown: { starter: "## Resultado\n\n- Notas: 8, 7, 9\n- Média: ...\n- Situação: ...", example: "- Valores: 6 e 8\n- Média: **7**", hint: "Calcule a média e descreva a decisão." },
  },
  discount: {
    pseudocode: { starter: "FUNÇÃO calcularCompra(valor)\n  SE valor >= 100 ENTÃO\n    // aplique 10% de desconto\n  FIM SE\n  RETORNE valor\nFIM FUNÇÃO", example: "SE valor >= 50 ENTÃO RETORNE valor * 0.95\nRETORNE valor", hint: "No caminho do desconto, retorne valor * 0.90." },
    python: { starter: "def calcularCompra(valor):\n    if valor >= 100:\n        # aplique 10% de desconto\n        pass\n    return valor", example: "if valor >= 50:\n    return valor * 0.95\nreturn valor", hint: "Dentro do if, use return valor * 0.90." },
    javascript: { starter: "function calcularCompra(valor) {\n  if (valor >= 100) {\n    // aplique 10% de desconto\n  }\n  return valor;\n}", example: "if (valor >= 50) return valor * 0.95;\nreturn valor;", hint: "Dentro do if, use return valor * 0.90;" },
    typescript: { starter: "function calcularCompra(valor: number): number {\n  if (valor >= 100) {\n    // aplique 10% de desconto\n  }\n  return valor;\n}", example: "if (valor >= 50) return valor * 0.95;\nreturn valor;", hint: "Dentro do if, use return valor * 0.90;" },
    java: { starter: "class Solucao {\n  static double calcularCompra(double valor) {\n    if (valor >= 100) {\n      // aplique 10% de desconto\n    }\n    return valor;\n  }\n}", example: "if (valor >= 50) return valor * 0.95;\nreturn valor;", hint: "Dentro do if, use return valor * 0.90;" },
    sql: { starter: "SELECT valor,\n  CASE WHEN valor >= 100 THEN -- valor com desconto\n  ELSE valor END AS valor_final\nFROM compras;", example: "CASE WHEN valor >= 50 THEN valor * 0.95 ELSE valor END", hint: "Use valor * 0.90 no caminho do desconto." },
    html: { starter: "<section class=\"compra\">\n  <!-- mostre valor original, desconto e total -->\n</section>", example: "<section><p>Valor: 50</p><strong>Total: 47,50</strong></section>", hint: "Use parágrafos para os valores e strong para o total." },
    css: { starter: ".valor-original { /* valor anterior */ }\n.valor-final { /* destaque o total */ }", example: ".valor-final { font-size: 1.5rem; font-weight: 700; }", hint: "Dê mais destaque ao valor final." },
    markdown: { starter: "## Resumo da compra\n\n- Valor original: ...\n- Desconto: ...\n- Total: **...**", example: "- Valor: 50\n- Desconto: 5%\n- Total: **47,50**", hint: "Mostre os três passos do cálculo." },
  },
  sumEven: {
    pseudocode: { starter: "FUNÇÃO somarPares(numeros)\n  total <- 0\n  PARA CADA numero EM numeros\n    SE numero % 2 IGUAL A 0 ENTÃO\n      // some apenas este número\n    FIM SE\n  FIM PARA\n  RETORNE total\nFIM FUNÇÃO", example: "total <- 0\nPARA CADA numero EM numeros\n  SE numero > 0 ENTÃO\n    total <- total + numero\n  FIM SE\nFIM PARA", hint: "Dentro da condição, atualize total com total + numero." },
    python: { starter: "def somarPares(numeros):\n    total = 0\n    for numero in numeros:\n        if numero % 2 == 0:\n            # some apenas este número\n            pass\n    return total", example: "total = 0\nfor numero in numeros:\n    if numero > 0:\n        total = total + numero", hint: "Use total = total + numero dentro do if." },
    javascript: { starter: "function somarPares(numeros) {\n  let total = 0;\n  for (const numero of numeros) {\n    if (numero % 2 === 0) {\n      // some apenas este número\n    }\n  }\n  return total;\n}", example: "let total = 0;\nfor (const numero of numeros) {\n  if (numero > 0) total = total + numero;\n}", hint: "Use total = total + numero dentro do if." },
    typescript: { starter: "function somarPares(numeros: number[]): number {\n  let total = 0;\n  for (const numero of numeros) {\n    if (numero % 2 === 0) {\n      // some apenas este número\n    }\n  }\n  return total;\n}", example: "let total = 0;\nfor (const numero of numeros) {\n  if (numero > 0) total += numero;\n}", hint: "Use total = total + numero dentro do if." },
    java: { starter: "class Solucao {\n  static int somarPares(int[] numeros) {\n    int total = 0;\n    for (int numero : numeros) {\n      if (numero % 2 == 0) {\n        // some apenas este número\n      }\n    }\n    return total;\n  }\n}", example: "int total = 0;\nfor (int numero : numeros) {\n  if (numero > 0) total += numero;\n}", hint: "Use total = total + numero dentro do if." },
    sql: { starter: "SELECT SUM(valor) AS total_pares\nFROM numeros\nWHERE -- mantenha apenas os pares;", example: "SELECT SUM(valor) FROM numeros WHERE valor > 0;", hint: "Use valor % 2 = 0 no WHERE." },
    html: { starter: "<ul class=\"numeros\">\n  <!-- destaque apenas os números pares -->\n</ul>\n<strong>Total: <!-- soma --></strong>", example: "<ul><li>1</li><li class=\"selecionado\">2</li></ul>", hint: "Liste os valores e destaque visualmente os pares." },
    css: { starter: ".numero { /* estado comum */ }\n.numero.par { /* valor selecionado para a soma */ }", example: ".selecionado { background: lightgreen; }", hint: "Destaque a classe .par com cor ou peso." },
    markdown: { starter: "## Soma dos pares\n\n- Valores: 1, 2, 3, 4\n- Pares encontrados: ...\n- Soma: **...**", example: "- Valores positivos: 2, 4\n- Soma: **6**", hint: "Identifique 2 e 4 antes de calcular a soma." },
  },
};

function translateTypeScript(code: string) {
  return code
    .replace(/:\s*(number|boolean|string)(\[\])?/g, "")
    .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, "");
}

function translateJava(code: string) {
  return code
    .replace(/class\s+Solucao/g, "class Solucao")
    .replace(/static\s+(int\[\]|int|boolean|double|String)\s+(\w+)\s*\(([^)]*)\)/g, (_m, _type, name, params) => `static ${name}(${params.replace(/(int\[\]|int|boolean|double|String)\s+/g, "")})`)
    .replace(/int\[\]\s+(\w+)\s*=\s*new\s+int\[(\d+)\];/g, "let $1 = new Array($2);")
    .replace(/for\s*\(int\s+(\w+)\s*:\s*(\w+)\)/g, "for (const $1 of $2)")
    .replace(/for\s*\(int\s+/g, "for (let ")
    .replace(/\bint\s+(\w+)\s*=/g, "let $1 =")
    .replace(/\b(double|String|boolean)\s+(\w+)\s*=/g, "let $2 =");
}

function translatePseudocode(code: string) {
  return code
    .replace(/\/\/.*$/gm, "")
    .replace(/IGUAL A/gi, "===")
    .replace(/RETORNE\s+([^\n=]+)\s*=\s*([^\n]+)/gi, "return $1 === $2")
    .replace(/FUNÇÃO\s+(\w+)\(([^)]*)\)/gi, "function $1($2) {")
    .replace(/FIM FUNÇÃO/gi, "}")
    .replace(/SE\s+(.+?)\s+ENTÃO\s+RETORNE\s+(.+)/gi, "if ($1) return $2")
    .replace(/SE\s+(.+?)\s+ENTÃO/gi, "if ($1) {")
    .replace(/SENÃO/gi, "} else {")
    .replace(/FIM SE/gi, "}")
    .replace(/PARA\s+(\w+)\s+DE\s+(\d+)\s+ATÉ\s+(\d+)/gi, "for (let $1 = $2; $1 <= $3; $1++) {")
    .replace(/PARA CADA\s+(\w+)\s+EM\s+(\w+)/gi, "for (const $1 of $2) {")
    .replace(/FIM PARA/gi, "}")
    .replace(/(\w+)\s*<-\s*LISTA VAZIA/gi, "let $1 = []")
    .replace(/(\w+)\s*<-\s*([^\n]+)/gi, "let $1 = $2")
    .replace(/let\s+(\w+)\s*=\s*\1\s*([+*/-])/gi, "$1 = $1 $2")
    .replace(/ADICIONE\s+(.+?)\s+EM\s+(\w+)/gi, "$2.push($1)")
    .replace(/RETORNE\s+/gi, "return ")
    .replace(/\bE\b/gi, "&&")
    .replace(/<>/g, "!==");
}

function runJavascriptLike(code: string, lesson: Lesson, language: LanguageId): Promise<RunResult> {
  return new Promise((resolve) => {
    const translated = language === "typescript" ? translateTypeScript(code) : language === "java" ? translateJava(code) : language === "pseudocode" ? translatePseudocode(code) : code;
    const resolver = language === "java" ? `typeof Solucao !== "undefined" ? Solucao[functionName].bind(Solucao) : null` : `typeof eval(functionName) === "function" ? eval(functionName) : null`;
    const workerSource = `self.onmessage = (event) => { const { code, functionName, tests } = event.data; try { const fn = new Function('functionName', code + '; return (${resolver});')(functionName); if (!fn) throw new Error('Não encontrei a função pedida.'); const lines = tests.map((test, index) => { try { const result = fn(...test.args); const pass = JSON.stringify(result) === JSON.stringify(test.expected); return 'Teste ' + (index + 1) + ': ' + (pass ? 'passou ✓' : 'esperava ' + JSON.stringify(test.expected) + ', recebeu ' + JSON.stringify(result)); } catch (error) { return 'Teste ' + (index + 1) + ': erro — ' + error.message; } }); self.postMessage({ ok: lines.every(line => line.includes('passou')), lines }); } catch (error) { self.postMessage({ ok: false, lines: ['Erro: ' + error.message] }); } };`;
    const blobUrl = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
    const worker = new Worker(blobUrl);
    const timer = window.setTimeout(() => { worker.terminate(); URL.revokeObjectURL(blobUrl); resolve({ ok: false, lines: ["O código demorou demais. Confira se alguma repetição nunca termina."] }); }, 3000);
    worker.onmessage = (event) => { window.clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(blobUrl); resolve(event.data); };
    worker.postMessage({ code: translated, functionName: lesson.functionName, tests: lesson.tests });
  });
}

function runPython(code: string, lesson: Lesson): Promise<RunResult> {
  return new Promise((resolve) => {
    const testsJson = JSON.stringify(lesson.tests).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const pythonScript = `${code}\nimport json\n_tests = json.loads('${testsJson}')\n_lines = []\n_ok = True\nfor _index, _test in enumerate(_tests):\n    try:\n        _result = globals()['${lesson.functionName}'](*_test['args'])\n        _pass = _result == _test['expected']\n        _ok = _ok and _pass\n        _lines.append(f\"Teste {_index + 1}: passou ✓\" if _pass else f\"Teste {_index + 1}: esperava {_test['expected']!r}, recebeu {_result!r}\")\n    except Exception as _error:\n        _ok = False\n        _lines.append(f\"Teste {_index + 1}: erro — {_error}\")\njson.dumps({'ok': _ok, 'lines': _lines}, ensure_ascii=False)`;
    const workerSource = `importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.6/full/pyodide.js'); self.onmessage = async (event) => { try { const pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.6/full/' }); const result = await pyodide.runPythonAsync(event.data); self.postMessage(JSON.parse(result)); } catch (error) { self.postMessage({ ok: false, lines: ['Erro: ' + error.message] }); } };`;
    const blobUrl = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
    const worker = new Worker(blobUrl);
    const timer = window.setTimeout(() => { worker.terminate(); URL.revokeObjectURL(blobUrl); resolve({ ok: false, lines: ["Python ainda está carregando ou o código demorou demais. Tente executar novamente."] }); }, 20000);
    worker.onmessage = (event) => { window.clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(blobUrl); resolve(event.data); };
    worker.postMessage(pythonScript);
  });
}

function reviewSupportingLanguage(code: string, language: LanguageId, lesson: Lesson): RunResult {
  const lower = code.toLowerCase();
  const checks: Record<LanguageId, boolean> = {
    pseudocode: false, python: false, javascript: false, typescript: false, java: false,
    sql: lower.includes("select") && (
      lesson.id === "double" ? lower.includes("* 2")
        : lesson.id === "even" ? lower.includes("% 2")
          : lesson.id === "larger" ? lower.includes("max(")
            : lesson.id === "table" ? lower.includes("*")
              : lesson.id === "sign" || lesson.id === "average" || lesson.id === "discount" ? lower.includes("case")
                : lesson.id === "vote" ? lower.includes(">= 16")
                  : lesson.id === "sumEven" ? lower.includes("sum(") && lower.includes("% 2")
                    : lower.includes("sum(")
    ),
    html: /<(ol|ul|table|section|div)/.test(lower) && /<(li|tr|p|span|strong)/.test(lower),
    css: lower.includes("{") && lower.includes(":") && lower.includes("}"),
    markdown: /(^|\n)(1\.|-|\|)/.test(code),
  };
  const label = languages.find((item) => item.id === language)?.label;
  return checks[language]
    ? { ok: true, lines: [`Estrutura de ${label} reconhecida ✓`, "Aqui o objetivo é representar ou consultar a lógica, não executar a função como em Python ou JavaScript."] }
    : { ok: false, lines: [`Ainda falta uma estrutura essencial de ${label}.`, snippets[lesson.id][language].hint] };
}

function normalizeQuestion(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function describeCodeState(code: string, language: LanguageId, lesson: Lesson) {
  const normalizedCode = normalizeQuestion(code);
  const stillHasPlaceholder = /pass|escreva|caminho|atualize|guarde|calcule|condicao|complete|--/.test(normalizedCode);
  const hasReturn = /return|retorne/.test(normalizedCode);

  if (stillHasPlaceholder && !hasReturn) {
    return `Seu código ainda está no ponto inicial: o espaço do comentário precisa ser substituído pelo passo principal. Para este desafio, pense em “${lesson.logicSteps[1]}”.`;
  }
  if (!hasReturn && ["pseudocode", "python", "javascript", "typescript", "java"].includes(language)) {
    return `Ainda não encontrei o comando que devolve a resposta. Em ${languages.find((item) => item.id === language)?.label}, procure onde usar ${language === "pseudocode" ? "RETORNE" : "return"}.`;
  }
  return "Sua estrutura já tem uma tentativa de solução. Execute os testes e me diga qual valor foi esperado e qual foi recebido; assim localizamos exatamente o passo que precisa mudar.";
}

function buildTutorAnswer(
  question: string,
  code: string,
  lesson: Lesson,
  language: LanguageId,
  result: RunResult | null,
) {
  const lower = normalizeQuestion(question);
  const languageInfo = languages.find((item) => item.id === language)!;
  const snippet = snippets[lesson.id][language];
  const asksAboutExample = /triplo|exemplo|primeiro teste|isso e.*teste|e um teste/.test(lower);
  const asksAboutCalculation = /2\s*\+\s*2|multiplicar por 2|vezes 2|fazer.*calculo|colocar.*resultado/.test(lower);
  const asksWhere = /onde|fim da funcao|dentro da funcao|em qual linha|aonde/.test(lower);
  const asksAboutTests = /\bteste\b|valor esperado|recebido/.test(lower);
  const asksAboutCode = /meu codigo|meu código|o que escrevi|analise|explique.*codigo|explique.*código/.test(lower);
  const asksWhy = /por que|porque|pra que|para que/.test(lower);

  if (lesson.id === "double" && asksAboutExample) {
    return [
      "Não: o código do triplo é um EXEMPLO parecido, não é o primeiro teste.",
      "",
      "Ele mostra este padrão:",
      "1. A função recebe um valor chamado numero.",
      "2. Faz uma transformação com esse valor.",
      "3. Devolve o novo valor com RETORNE.",
      "",
      "No exemplo, a transformação é numero × 3. No seu desafio, troque a ideia de triplo pela ideia de dobro: numero × 2.",
    ].join("\n");
  }

  if (lesson.id === "double" && asksAboutCalculation) {
    return [
      "Você não deve escrever 2 + 2 nem colocar um resultado fixo.",
      "",
      "O nome numero representa qualquer entrada. Se entrar 2, o resultado será 4; se entrar 7, será 14.",
      "",
      "Dentro da função, antes de FIM FUNÇÃO, escreva:",
      "RETORNE numero * 2",
      "",
      "Depois clique em Executar e testar. O sistema fará vários cálculos automaticamente.",
    ].join("\n");
  }

  if (asksWhere) {
    return language === "pseudocode"
      ? `Escreva o passo principal entre “FUNÇÃO ${lesson.functionName}(...)” e “FIM FUNÇÃO”. Substitua o comentário, sem escrever nada depois de FIM FUNÇÃO.\n\nPista para este desafio: ${snippet.hint}`
      : `Escreva dentro da função, no lugar do comentário ou do “pass”. Não coloque a resposta depois da chave ou do fim da função.\n\nPista em ${languageInfo.label}: ${snippet.hint}`;
  }

  if (asksAboutTests) {
    const examples = lesson.tests
      .slice(0, 2)
      .map((test) => `entrada ${JSON.stringify(test.args)} → esperado ${JSON.stringify(test.expected)}`)
      .join("\n");
    return `Os testes não são linhas que você precisa escrever. Eles são verificações automáticas feitas quando você clica em Executar e testar.\n\nNeste desafio, alguns testes são:\n${examples}\n\nSeu trabalho é escrever uma regra que funcione para todos eles.`;
  }

  if (asksAboutCode) {
    return describeCodeState(code, language, lesson);
  }

  if (lower.includes("erro") || result?.ok === false) {
    const testFeedback = result?.lines?.[0] ? `\n\nÚltimo retorno: ${result.lines[0]}` : "";
    return `Vamos depurar sem apagar tudo. Primeiro confirme se a função recebe os valores pedidos. Depois verifique a transformação “${lesson.logicSteps[1]}” e, por último, se você devolveu o resultado.${testFeedback}\n\n${describeCodeState(code, language, lesson)}`;
  }

  if (asksWhy) {
    return `Porque o objetivo não é decorar uma resposta, e sim criar uma regra. A entrada muda, mas os passos continuam iguais: ${lesson.logicSteps.join(" → ")}. É essa regra que os testes verificam.`;
  }

  if (lower.includes("linguagem")) {
    return `A lógica deste exercício não muda quando você troca de linguagem: ${lesson.logicSteps.join(" → ")}. Em ${languageInfo.label}, muda apenas a forma de escrever esses passos.`;
  }

  if (/nao sei|estou perdido|travei|comecar|primeiro passo/.test(lower)) {
    return `Vamos fazer uma etapa por vez.\n\n1. Entrada: ${lesson.logicSteps[0]}.\n2. Transformação: ${lesson.logicSteps[1]}.\n3. Saída: ${lesson.logicSteps[2]}.\n\nAgora olhe seu código e encontre o comentário vazio. É ali que você traduz o passo 2 para ${languageInfo.label}.`;
  }

  if (lower.includes("resposta")) {
    return `Posso aproximar a dica sem pular seu raciocínio. Para “${lesson.title}”, a estrutura que falta é: ${snippet.hint}\n\nAntes de copiar, me diga com suas palavras o que deve acontecer com a entrada.`;
  }

  return `Entendi sua dúvida dentro do desafio “${lesson.title}”. Você está usando ${languageInfo.label} e precisa representar estes passos: ${lesson.logicSteps.join(" → ")}.\n\n${describeCodeState(code, language, lesson)}\n\nVocê pode me perguntar “isso é exemplo ou teste?”, “onde escrevo?” ou “explique meu código”.`;
}

export default function Home() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [language, setLanguage] = useState<LanguageId>("pseudocode");
  const [code, setCode] = useState(snippets.double.pseudocode.starter);
  const [messages, setMessages] = useState<Message[]>([{ role: "tutor", text: "Vamos pensar antes de programar: entrada, passos e saída. Depois você escolhe a linguagem para escrever a mesma lógica." }]);
  const [input, setInput] = useState("");
  const [hintIndex, setHintIndex] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const lesson = lessons[lessonIndex];
  const languageInfo = languages.find((item) => item.id === language)!;
  const snippet = snippets[lesson.id][language];

  useEffect(() => {
    const savedProgress = window.localStorage.getItem("logica-multilang-completed");
    const savedLanguage = window.localStorage.getItem("logica-language") as LanguageId | null;
    if (savedProgress) setCompleted(JSON.parse(savedProgress));
    if (savedLanguage && languages.some((item) => item.id === savedLanguage)) {
      setLanguage(savedLanguage);
      setCode(snippets.double[savedLanguage].starter);
    }
  }, []);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const completedLessons = useMemo(() => new Set(completed.map((item) => item.split(":")[1])).size, [completed]);
  const progress = Math.round((completedLessons / lessons.length) * 100);
  const answerLine = useMemo(() => {
    const lines = snippet.starter.split("\n");
    const index = lines.findIndex((line) => /escreva|compare|caminho|guarde|atualize|calcule|condi[cç][aã]o|complete|pass|\?/.test(normalizeQuestion(line)));
    return Math.max(index, 1);
  }, [snippet.starter]);

  function switchLanguage(next: LanguageId) {
    setLanguage(next);
    setCode(snippets[lesson.id][next].starter);
    setResult(null);
    setHintIndex(0);
    window.localStorage.setItem("logica-language", next);
    const info = languages.find((item) => item.id === next)!;
    setMessages((old) => [...old, { role: "tutor", text: `${info.label} selecionado. A lógica do desafio continua a mesma; muda apenas a maneira de expressá-la.` }]);
  }

  function chooseLesson(index: number) {
    setLessonIndex(index);
    setCode(snippets[lessons[index].id][language].starter);
    setHintIndex(0);
    setResult(null);
    setMessages((old) => [...old, { role: "tutor", text: `Novo problema: “${lessons[index].title}”. Primeiro leia o mapa da lógica; depois escreva o código.` }]);
  }

  function askHint() {
    const hints = [`Repita em voz alta os três passos do mapa da lógica.`, snippet.hint, `Compare sua tentativa com o exemplo parecido — observe a estrutura, não copie o resultado.`];
    const hint = hints[Math.min(hintIndex, hints.length - 1)];
    setMessages((old) => [...old, { role: "student", text: "Quero uma dica" }, { role: "tutor", text: `Dica ${Math.min(hintIndex + 1, hints.length)}: ${hint}` }]);
    setHintIndex((value) => Math.min(value + 1, hints.length - 1));
  }

  function askTutor(question: string) {
    const text = question.trim();
    if (!text) return;
    const answer = buildTutorAnswer(text, code, lesson, language, result);
    setMessages((old) => [...old, { role: "student", text }, { role: "tutor", text: answer }]);
    setInput("");
  }

  function sendMessage() {
    askTutor(input);
  }

  async function execute() {
    setRunning(true);
    setResult(null);
    let next: RunResult;
    if (language === "python") next = await runPython(code, lesson);
    else if (["javascript", "typescript", "java", "pseudocode"].includes(language)) next = await runJavascriptLike(code, lesson, language);
    else next = reviewSupportingLanguage(code, language, lesson);
    setRunning(false);
    setResult(next);
    if (next.ok) {
      const key = `${language}:${lesson.id}`;
      const updated = Array.from(new Set([...completed, key]));
      setCompleted(updated);
      window.localStorage.setItem("logica-multilang-completed", JSON.stringify(updated));
      setMessages((old) => [...old, { role: "tutor", text: `Muito bem! Você resolveu usando ${languageInfo.label}. Agora experimente trocar a linguagem e observe: o raciocínio permanece, mas a sintaxe muda.` }]);
    } else {
      setMessages((old) => [...old, { role: "tutor", text: "Ainda não chegou ao resultado. Não reescreva tudo: escolha um único passo do mapa, ajuste e execute novamente." }]);
    }
  }

  const modeNote = languageInfo.executable
    ? `${languageInfo.label} pode representar o algoritmo completo deste desafio.`
    : `${languageInfo.label} é uma tecnologia de ${languageInfo.group.toLowerCase()}. Aqui você pratica como representar a lógica, não como executar o mesmo algoritmo.`;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">L/01</span><div><strong>LÓGICA LAB</strong><small>SISTEMA DE TREINO / EST. 2026</small></div></div>
        <label className="language-picker"><span>LINGUAGEM DE OPERAÇÃO</span><select value={language} onChange={(event) => switchLanguage(event.target.value as LanguageId)}>{languages.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.group}</option>)}</select></label>
        <div className="progress-wrap"><span>{completedLessons} de {lessons.length} conceitos</span><div className="progress"><i style={{ width: `${progress}%` }} /></div><b>{progress}%</b></div>
        <div className="system-code" aria-hidden="true">SYS.LOGIC / BR-SP<br />SESSION_001</div>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="sidebar-heading"><span>Trilha de lógica</span><small>{languageInfo.label}</small></div>
          <nav aria-label="Lista de exercícios">{lessons.map((item, index) => <button key={item.id} className={`lesson-link ${index === lessonIndex ? "active" : ""}`} onClick={() => chooseLesson(index)}><span className={`lesson-number ${completed.some((entry) => entry.endsWith(`:${item.id}`)) ? "done" : ""}`}>{completed.some((entry) => entry.endsWith(`:${item.id}`)) ? "✓" : index + 1}</span><span><strong>{item.title}</strong><small>{item.level}</small></span></button>)}</nav>
          <div className="encouragement"><span>✦</span><p><strong>A linguagem é a ferramenta.</strong><br />A lógica é o plano que funciona em todas elas.</p></div>
        </aside>

        <section className="chat-panel">
          <div className="mascot-stage"><div className="mascot-copy"><span>OPERADOR / NÓ</span><strong>SEU PARCEIRO<br />DE RACIOCÍNIO</strong><small>UNIDADE TUTORIAL 01</small></div><img src="/no-mascot-v1.png" alt="Nó, gato mascote do tutor de lógica" /></div>
          <div className="panel-title"><div className="tutor-avatar"><img src="/no-mascot-v1.png" alt="" /></div><div><strong>NÓ / TUTOR DE RACIOCÍNIO</strong><small><i /> CANAL ATIVO</small></div></div>
          <div className="messages">{messages.map((message, index) => <div key={index} className={`message ${message.role}`}>{message.role === "tutor" && <img className="message-avatar" src="/no-mascot-v1.png" alt="" />}<span>{message.text}</span></div>)}<div ref={chatEnd} /></div>
          <div className="quick-actions"><button onClick={askHint}>💡 Dica gradual</button><button onClick={() => askTutor("Isso é exemplo ou teste?")}>◫ Exemplo ou teste?</button><button onClick={() => askTutor("Explique meu código")}>⌁ Explique meu código</button><button onClick={() => setMessages((old) => [...old, { role: "tutor", text: `Você está treinando ${lesson.concept}. Isso existe em várias linguagens.` }])}>◎ O que estou treinando?</button></div>
          <div className="chat-input"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMessage()} placeholder="Conte onde você travou..." aria-label="Mensagem para o tutor" /><button onClick={sendMessage} aria-label="Enviar mensagem">↑</button></div>
        </section>

        <section className="practice-panel">
          <div className="practice-index" aria-hidden="true"><span>MODULE</span><b>0{lessonIndex + 1}</b><small>LOGIC / CORE</small></div>
          <div className="challenge-card">
            <div className="eyebrow"><span>DESAFIO {lessonIndex + 1}</span><small>{lesson.level}</small><small className={languageInfo.executable ? "mode-chip" : "mode-chip support"}>{languageInfo.group}</small></div>
            <h1>{lesson.title}</h1><p>{lesson.statement}</p>
            <div className="mode-note"><strong>{languageInfo.label}</strong><span>{modeNote}</span></div>
            <div className="logic-map"><div className="logic-map-title"><span>1</span><strong>Pense antes do código</strong></div><div className="logic-steps">{lesson.logicSteps.map((step, index) => <div key={step}><b>{index + 1}</b><span>{step}</span>{index < lesson.logicSteps.length - 1 && <i>→</i>}</div>)}</div></div>
            <details className="example-card" open><summary><span><b>2</b><strong>Veja um exemplo parecido</strong></span><small>estrutura, não resposta</small></summary><pre><code>{snippet.example}</code></pre></details>
          </div>

          <div className="editor-heading"><span><b>3</b><strong>Agora escreva você</strong></span><small>arquivo: desafio.{languageInfo.extension}</small></div>
          <div className="editor-card">
            <div className="editor-top"><span><i className="dot red" /><i className="dot yellow" /><i className="dot green" /> desafio.{languageInfo.extension}</span><button onClick={() => setCode(snippet.starter)}>Recomeçar</button></div>
            <div className="editor-body">
              <div className="answer-line-highlight" style={{ top: `${20 + answerLine * 24.5}px` }} aria-hidden="true"><span>RESPONDA AQUI · LINHA {answerLine + 1}</span></div>
              <div className="line-numbers">{Array.from({ length: Math.max(code.split("\n").length, 5) }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
              <textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} aria-label={`Editor de ${languageInfo.label}`} />
            </div>
            <div className={`terminal-panel ${result ? (result.ok ? "success" : "failure") : ""}`}>
              <div className="terminal-tabs"><span className="active">CASOS DE TESTE</span><span>CONSOLE</span></div>
              <div className="terminal-content">
                <div><small>SAÍDA</small>{result ? <><strong>{result.ok ? "Sua lógica funcionou!" : "Vamos ajustar um passo"}</strong>{result.lines.map((line, index) => <code key={index}>{line}</code>)}</> : <code className="terminal-idle">Aguardando você executar o código...</code>}</div>
                <div><small>FLUXO ESPERADO</small><code>{lesson.logicSteps.join(" → ")}</code></div>
              </div>
            </div>
          </div>
          <div className="run-row"><button className="run-button" onClick={execute} disabled={running}><span>▶</span>{running ? (language === "python" ? "Carregando Python..." : "Verificando...") : languageInfo.executable ? "Executar e testar" : "Analisar estrutura"}</button><small>{languageInfo.executable ? "Os testes comparam sua saída com exemplos esperados." : "Este modo ensina o papel da tecnologia na solução."}</small></div>
          <footer className="learning-footer" id="guia-logica">
            <details>
              <summary>
                <span><small>BIBLIOTECA DE APOIO</small><strong>Lógica de programação: aprenda a pensar antes do código</strong></span>
                <b>Ler artigo +</b>
              </summary>
              <article>
                <header>
                  <span>GUIA / FUNDAMENTOS</span>
                  <h2>Programar começa com um problema, não com uma linguagem.</h2>
                  <p>Python, JavaScript, SQL, Excel e ferramentas de automação escrevem instruções de maneiras diferentes, mas todas dependem da mesma habilidade: organizar o pensamento em passos claros.</p>
                </header>

                <section>
                  <h3>As quatro perguntas que vêm antes do código</h3>
                  <div className="thinking-grid">
                    <div><b>01 / Entrada</b><p>O que eu vou receber?</p></div>
                    <div><b>02 / Processo</b><p>O que preciso calcular ou transformar?</p></div>
                    <div><b>03 / Decisão</b><p>Existe alguma condição ou escolha?</p></div>
                    <div><b>04 / Saída</b><p>O que devo entregar no final?</p></div>
                  </div>
                </section>

                <section className="article-example">
                  <div>
                    <span>EXEMPLO 01</span>
                    <h3>Descobrir se um número é par</h3>
                    <ol><li>Receber o número.</li><li>Calcular o resto da divisão por 2.</li><li>Comparar o resto com zero.</li></ol>
                    <p>O símbolo <code>%</code> calcula o resto. A regra precisa funcionar para qualquer número, não somente para um exemplo específico.</p>
                  </div>
                  <pre><code>{`def eh_par(numero):
    return numero % 2 == 0

eh_par(8)  # True
eh_par(5)  # False`}</code></pre>
                </section>

                <section className="article-example">
                  <div>
                    <span>EXEMPLO 02</span>
                    <h3>Tomar uma decisão</h3>
                    <p>Uma pessoa só pode entrar se tiver 18 anos ou mais. Primeiro recebemos a idade, depois comparamos com a regra e finalmente devolvemos uma resposta.</p>
                  </div>
                  <pre><code>{`def pode_entrar(idade):
    if idade >= 18:
        return "Entrada permitida"

    return "Entrada não permitida"`}</code></pre>
                </section>

                <section className="article-example">
                  <div>
                    <span>EXEMPLO 03</span>
                    <h3>Combinar cálculo e condição</h3>
                    <p>Compras de R$ 100 ou mais recebem 10% de desconto. O valor muda, mas a sequência de raciocínio continua igual.</p>
                  </div>
                  <pre><code>{`def calcular_compra(valor):
    if valor >= 100:
        desconto = valor * 0.10
        return valor - desconto

    return valor`}</code></pre>
                </section>

                <section>
                  <h3>A lógica existe em qualquer ferramenta</h3>
                  <p>Imagine uma automação que avisa quando uma tarefa está atrasada. A ferramenta pode ser Python, uma planilha ou um sistema de automação. O plano continua sendo:</p>
                  <div className="logic-flow"><span>Buscar tarefas</span><i>→</i><span>Comparar datas</span><i>→</i><span>Verificar conclusão</span><i>→</i><span>Enviar aviso</span></div>
                  <p className="article-callout"><strong>Entrada → processamento → decisão → resultado.</strong> Quando você consegue explicar a solução com palavras simples, escrever o código fica muito mais fácil.</p>
                </section>

                <section className="article-example">
                  <div>
                    <span>EXEMPLO 04</span>
                    <h3>Média de três notas</h3>
                    <p>Separe o problema: receber três notas, calcular a média, comparar com 7 e devolver a situação.</p>
                  </div>
                  <pre><code>{`def verificar_aprovacao(nota1, nota2, nota3):
    media = (nota1 + nota2 + nota3) / 3

    if media >= 7:
        return "Aprovado"

    return "Reprovado"`}</code></pre>
                </section>

                <blockquote>Não tente memorizar todas as respostas. Treine a capacidade de dividir problemas grandes em passos pequenos. Essa habilidade funciona em qualquer linguagem ou ferramenta.</blockquote>
              </article>
            </details>
          </footer>
        </section>
      </section>
    </main>
  );
}
