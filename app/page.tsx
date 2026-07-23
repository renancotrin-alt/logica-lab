"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Lesson = {
  title: string;
  level: string;
  statement: string;
  concept: string;
  functionName: string;
  starter: string;
  hints: string[];
  tests: { args: unknown[]; expected: unknown }[];
};

type Message = { role: "tutor" | "student"; text: string };

const lessons: Lesson[] = [
  {
    title: "O dobro de um número",
    level: "Fundamentos",
    statement: "Crie a função dobro(numero) e faça ela devolver o número multiplicado por 2.",
    concept: "variáveis, função e retorno",
    functionName: "dobro",
    starter: "function dobro(numero) {\n  // escreva sua lógica aqui\n  \n}",
    hints: ["Pense na operação que representa duas vezes o mesmo valor.", "Use o operador de multiplicação: *.", "A linha principal começa com: return numero ..."],
    tests: [{ args: [3], expected: 6 }, { args: [0], expected: 0 }, { args: [-4], expected: -8 }],
  },
  {
    title: "É par ou ímpar?",
    level: "Condições",
    statement: "Crie a função ehPar(numero). Ela deve devolver true quando o número for par e false quando for ímpar.",
    concept: "condição e operador de resto",
    functionName: "ehPar",
    starter: "function ehPar(numero) {\n  // use uma condição ou comparação\n  \n}",
    hints: ["Um número par tem resto zero quando dividido por 2.", "O operador de resto é %.", "Você pode retornar diretamente a comparação numero % 2 === 0."],
    tests: [{ args: [8], expected: true }, { args: [7], expected: false }, { args: [0], expected: true }],
  },
  {
    title: "Qual é o maior?",
    level: "Condições",
    statement: "Crie a função maior(a, b), devolvendo o maior dos dois números. Se forem iguais, devolva qualquer um deles.",
    concept: "if, else e comparação",
    functionName: "maior",
    starter: "function maior(a, b) {\n  // compare os dois valores\n  \n}",
    hints: ["Pergunte: a é maior que b?", "Use if (a > b) e return.", "Depois do if, você pode retornar b."],
    tests: [{ args: [9, 4], expected: 9 }, { args: [2, 7], expected: 7 }, { args: [5, 5], expected: 5 }],
  },
  {
    title: "Tabuada curta",
    level: "Repetições",
    statement: "Crie tabuada(numero), devolvendo uma lista com numero × 1, × 2, × 3, × 4 e × 5.",
    concept: "laço for e listas",
    functionName: "tabuada",
    starter: "function tabuada(numero) {\n  const resultados = [];\n  // repita de 1 até 5\n  \n  return resultados;\n}",
    hints: ["Use um laço for com um contador começando em 1.", "Enquanto contador <= 5, adicione numero * contador.", "Para adicionar na lista, use resultados.push(...)."],
    tests: [{ args: [2], expected: [2, 4, 6, 8, 10] }, { args: [0], expected: [0, 0, 0, 0, 0] }],
  },
  {
    title: "Somando uma lista",
    level: "Repetições",
    statement: "Crie somar(numeros), percorrendo a lista e devolvendo a soma de todos os valores.",
    concept: "acumulador, listas e repetição",
    functionName: "somar",
    starter: "function somar(numeros) {\n  let total = 0;\n  // percorra a lista e atualize total\n  \n  return total;\n}",
    hints: ["A variável total deve guardar a soma até o momento.", "Use for (const numero of numeros).", "Dentro do laço: total = total + numero."],
    tests: [{ args: [[1, 2, 3]], expected: 6 }, { args: [[]], expected: 0 }, { args: [[10, -3, 2]], expected: 9 }],
  },
];

function runCode(code: string, lesson: Lesson): Promise<{ ok: boolean; lines: string[] }> {
  return new Promise((resolve) => {
    const workerSource = `
      self.onmessage = (event) => {
        const { code, functionName, tests } = event.data;
        try {
          const fn = new Function(code + '; return typeof ' + functionName + ' === "function" ? ' + functionName + ' : null;')();
          if (!fn) throw new Error('Não encontrei a função ' + functionName + '.');
          const lines = tests.map((test, index) => {
            let result;
            try { result = fn(...test.args); }
            catch (error) { return 'Teste ' + (index + 1) + ': erro — ' + error.message; }
            const pass = JSON.stringify(result) === JSON.stringify(test.expected);
            return 'Teste ' + (index + 1) + ': ' + (pass ? 'passou ✓' : 'esperava ' + JSON.stringify(test.expected) + ', recebeu ' + JSON.stringify(result));
          });
          self.postMessage({ ok: lines.every(line => line.includes('passou')), lines });
        } catch (error) {
          self.postMessage({ ok: false, lines: ['Erro: ' + error.message] });
        }
      };
    `;
    const blob = new Blob([workerSource], { type: "text/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));
    const timer = window.setTimeout(() => {
      worker.terminate();
      resolve({ ok: false, lines: ["Seu código demorou demais. Veja se existe uma repetição que nunca termina."] });
    }, 2500);
    worker.onmessage = (event) => {
      window.clearTimeout(timer);
      worker.terminate();
      resolve(event.data);
    };
    worker.postMessage({ code, functionName: lesson.functionName, tests: lesson.tests });
  });
}

export default function Home() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [code, setCode] = useState(lessons[0].starter);
  const [messages, setMessages] = useState<Message[]>([
    { role: "tutor", text: "Olá! Eu sou o Lógica. Aqui você aprende escrevendo código de verdade. Leia o primeiro desafio e tente uma solução — errar faz parte." },
  ]);
  const [input, setInput] = useState("");
  const [hintIndex, setHintIndex] = useState(0);
  const [result, setResult] = useState<{ ok: boolean; lines: string[] } | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const lesson = lessons[lessonIndex];

  useEffect(() => {
    const saved = window.localStorage.getItem("logica-completed");
    if (saved) setCompleted(JSON.parse(saved));
  }, []);

  useEffect(() => chatEnd.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const progress = useMemo(() => Math.round((completed.length / lessons.length) * 100), [completed]);

  function chooseLesson(index: number) {
    setLessonIndex(index);
    setCode(lessons[index].starter);
    setHintIndex(0);
    setResult(null);
    setMessages((old) => [...old, { role: "tutor", text: `Vamos praticar “${lessons[index].title}”. Escreva uma primeira tentativa e execute os testes.` }]);
  }

  function askHint() {
    const hint = lesson.hints[Math.min(hintIndex, lesson.hints.length - 1)];
    setMessages((old) => [...old, { role: "student", text: "Quero uma dica" }, { role: "tutor", text: `Dica ${Math.min(hintIndex + 1, lesson.hints.length)}: ${hint}` }]);
    setHintIndex((value) => Math.min(value + 1, lesson.hints.length - 1));
  }

  function sendMessage() {
    const text = input.trim();
    if (!text) return;
    const lower = text.toLowerCase();
    let answer = "Boa pergunta. Primeiro descreva em palavras os passos que seu código precisa seguir. Depois transforme cada passo em uma linha.";
    if (lower.includes("dica") || lower.includes("ajuda")) answer = lesson.hints[Math.min(hintIndex, lesson.hints.length - 1)];
    else if (lower.includes("erro")) answer = "Execute os testes e leia o resultado de cada caso. Confira também chaves, parênteses e se a função usa exatamente o nome pedido.";
    else if (lower.includes("não sei") || lower.includes("nao sei")) answer = `Comece pequeno: este exercício pratica ${lesson.concept}. Tente escrever apenas a primeira operação necessária.`;
    else if (lower.includes("resposta")) answer = "Eu não vou entregar tudo de uma vez — quero que você construa a lógica. Peça uma dica e avançamos passo a passo.";
    setMessages((old) => [...old, { role: "student", text }, { role: "tutor", text: answer }]);
    setInput("");
  }

  async function execute() {
    setRunning(true);
    setResult(null);
    const nextResult = await runCode(code, lesson);
    setResult(nextResult);
    setRunning(false);
    if (nextResult.ok) {
      const nextCompleted = Array.from(new Set([...completed, lessonIndex]));
      setCompleted(nextCompleted);
      window.localStorage.setItem("logica-completed", JSON.stringify(nextCompleted));
      setMessages((old) => [...old, { role: "tutor", text: "Excelente! Todos os testes passaram. Você não apenas acertou: transformou uma ideia em passos que o computador entendeu." }]);
    } else {
      setMessages((old) => [...old, { role: "tutor", text: "Ainda não passou em todos os casos — e isso é treino de verdade. Observe o que era esperado, ajuste uma coisa e teste novamente." }]);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">{`{ }`}</span><div><strong>Lógica</strong><small>seu treino de programação</small></div></div>
        <div className="progress-wrap"><span>{completed.length} de {lessons.length} desafios</span><div className="progress"><i style={{ width: `${progress}%` }} /></div><b>{progress}%</b></div>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="sidebar-heading"><span>Trilha inicial</span><small>JavaScript</small></div>
          <nav aria-label="Lista de exercícios">
            {lessons.map((item, index) => (
              <button key={item.title} className={`lesson-link ${index === lessonIndex ? "active" : ""}`} onClick={() => chooseLesson(index)}>
                <span className={`lesson-number ${completed.includes(index) ? "done" : ""}`}>{completed.includes(index) ? "✓" : index + 1}</span>
                <span><strong>{item.title}</strong><small>{item.level}</small></span>
              </button>
            ))}
          </nav>
          <div className="encouragement"><span>✦</span><p><strong>Seu ritmo é o ritmo certo.</strong><br />A lógica cresce a cada tentativa.</p></div>
        </aside>

        <section className="chat-panel">
          <div className="panel-title"><div className="tutor-avatar">L</div><div><strong>Tutor Lógica</strong><small><i /> pronto para ajudar</small></div></div>
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}><span>{message.text}</span></div>
            ))}
            <div ref={chatEnd} />
          </div>
          <div className="quick-actions"><button onClick={askHint}>💡 Quero uma dica</button><button onClick={() => setMessages((old) => [...old, { role: "tutor", text: `Este exercício treina ${lesson.concept}.` }])}>◎ O que estou treinando?</button></div>
          <div className="chat-input"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMessage()} placeholder="Converse com o tutor..." aria-label="Mensagem para o tutor" /><button onClick={sendMessage} aria-label="Enviar mensagem">↑</button></div>
        </section>

        <section className="practice-panel">
          <div className="challenge-card"><div className="eyebrow"><span>DESAFIO {lessonIndex + 1}</span><small>{lesson.level}</small></div><h1>{lesson.title}</h1><p>{lesson.statement}</p><div className="example"><b>Objetivo</b><code>{lesson.functionName}(...)</code></div></div>
          <div className="editor-card">
            <div className="editor-top"><span><i className="dot red" /><i className="dot yellow" /><i className="dot green" /> seu_codigo.js</span><button onClick={() => setCode(lesson.starter)}>Recomeçar</button></div>
            <div className="editor-body"><div className="line-numbers">{Array.from({ length: Math.max(code.split("\n").length, 5) }, (_, i) => <span key={i}>{i + 1}</span>)}</div><textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} aria-label="Editor de código" /></div>
          </div>
          {result && <div className={`result-box ${result.ok ? "success" : "failure"}`}><strong>{result.ok ? "Tudo certo!" : "Vamos ajustar"}</strong>{result.lines.map((line, index) => <span key={index}>{line}</span>)}</div>}
          <div className="run-row"><button className="run-button" onClick={execute} disabled={running}><span>▶</span>{running ? "Testando..." : "Executar código"}</button><small>Seu código roda apenas neste aparelho.</small></div>
        </section>
      </section>
    </main>
  );
}
