// Cada conjunto corresponde a um único objetivo do percurso.
const banks = {};
function bank(key, options, rows) {
  banks[key] = rows.map(([prompt, answer, why]) => ({ prompt, choices: options, answer, why }));
}
bank('leitura-0', ['Causa', 'Contraste', 'Conclusão', 'Condição'], [
  ['“Releu o texto porque tinha dúvidas.” Que relação a segunda oração estabelece?', 0, 'A dúvida explica a releitura.'],
  ['“Treinou muito, contudo perdeu.” O que expressa “contudo”?', 1, 'O resultado contraria a expectativa criada pelo treino.'],
  ['“Os documentos conferem, portanto a etapa terminou.” Que relação introduz “portanto”?', 2, 'O encerramento é apresentado como consequência da conferência.'],
  ['“Participarei se houver vagas.” O que o segundo trecho estabelece?', 3, 'Participar depende da existência de vagas.'],
  ['“Como estava gripada, Lia descansou.” Qual é a função do primeiro trecho?', 0, 'A gripe é apresentada como motivo do descanso.'],
  ['“Embora fosse longe, foi a pé.” Qual relação há entre distância e decisão?', 1, 'A distância sugere um obstáculo que não impediu a caminhada.'],
  ['“A medida é provisória, logo será revista.” Qual a função de “logo”?', 2, 'O autor deduz a revisão do caráter provisório da medida.'],
  ['“Desde que apresente o recibo, poderá trocar.” Qual relação aparece?', 3, 'Apresentar o recibo é requisito para trocar.']
]);
bank('leitura-1', ['Sim, decorre do texto', 'Não, falta informação'], [
  ['“Só inscritos recebem o guia.” Caio recebeu o guia. Ele está inscrito?',0,'Receber o guia implica estar inscrito.'],
  ['“Alguns alunos chegaram cedo.” Podemos afirmar que todos chegaram cedo?',1,'“Alguns” não informa o que aconteceu com os demais.'],
  ['“Apenas finalistas votam.” Lia é finalista. Podemos garantir que ela votou?',1,'Ter permissão para votar não garante que ela votou.'],
  ['“Nenhum relatório foi publicado.” O relatório de maio também ficou sem publicação?',0,'A afirmação abrange todos os relatórios do grupo.'],
  ['“Toda oficina exige inscrição.” Uma atividade dispensa inscrição. Ela pode ser descartada como oficina?',0,'Uma oficina teria de exigir inscrição.'],
  ['“A biblioteca abre aos sábados.” Podemos concluir que fecha aos domingos?',1,'O horário de domingo não foi informado.'],
  ['“Uma equipe entregou antes do prazo.” Pelo menos uma entrega foi antecipada?',0,'A equipe citada satisfaz a afirmação.'],
  ['“A maioria aprovou.” Isso garante unanimidade?',1,'Maioria não garante que todos concordaram.']
]);
bank('logica-0', ['Verdadeira', 'Falsa'], [
  ['Se P é verdadeira e Q é falsa, qual é o valor de P e Q?',1,'A conjunção exige duas proposições verdadeiras.'],
  ['“8 é par e maior que 5.” Qual é o valor da frase?',0,'O número atende às duas condições.'],
  ['“12 é múltiplo de 3 e de 5.” Como classificar?',1,'12 é múltiplo de 3, mas não de 5.'],
  ['Se os dois documentos exigidos estão válidos, “A e B estão válidos” é…',0,'Ambas as condições foram satisfeitas.'],
  ['“9 é ímpar e primo.” Como classificar?',1,'9 é divisível por 3.'],
  ['“6 é positivo e menor que 10.” Como classificar?',0,'As duas comparações são verdadeiras.'],
  ['“0 é negativo e inteiro.” Qual é o valor da frase?',1,'Zero é inteiro, mas não é negativo.'],
  ['Uma tarefa foi entregue e assinada. A frase “foi assinada e entregue” é…',0,'Trocar a ordem mantém o valor da conjunção.']
]);
bank('logica-1', ['Todas', 'Pelo menos uma', 'Nenhuma'], [
  ['Para negar “nenhuma sala está aberta”, quantas salas precisam estar abertas?',1,'Basta um contraexemplo.'],
  ['Ao negar “alguma ficha venceu”, quantas fichas venceram?',2,'A negação exclui toda ficha vencida.'],
  ['Para negar “todas as lâmpadas acendem”, quantas precisam falhar?',1,'Uma falha já torna falsa a frase universal.'],
  ['Ao negar “alguma turma faltou”, quantas turmas faltaram?',2,'Não pode existir turma que tenha faltado.'],
  ['Ao negar “nem todas as notas subiram”, quantas notas subiram?',0,'Negar a exceção restabelece a afirmação universal.'],
  ['Para refutar “nenhuma entrega atrasou”, quantas entregas atrasadas bastam?',1,'Uma entrega atrasada refuta a afirmação.'],
  ['Ao negar “existe uma porta fechada”, quantas portas estão fechadas?',2,'A existência é negada para todas as portas.'],
  ['Ao negar “alguma caixa não está vazia”, quantas caixas estão vazias?',0,'Se não há caixa não vazia, todas estão vazias.']
]);
bank('cidadania-0', ['Impessoalidade','Publicidade','Eficiência','Legalidade'], [
  ['Uma chefia favorece um parente na fila. Que princípio é diretamente atingido?',0,'O vínculo pessoal substituiu o critério de atendimento.'],
  ['Divulgar os critérios de seleção concretiza mais diretamente qual princípio?',1,'A divulgação permite o conhecimento público.'],
  ['Reduzir desperdício mantendo a qualidade exemplifica qual princípio?',2,'Eficiência relaciona os recursos empregados aos resultados.'],
  ['Um agente verifica se a lei autoriza uma cobrança. Que princípio orienta a verificação?',3,'A atuação administrativa deve respeitar o ordenamento.'],
  ['Usar o brasão oficial em vez da foto eleitoral do gestor favorece qual princípio?',0,'A comunicação pertence à instituição e não à pessoa do gestor.'],
  ['Permitir consulta aos atos oficiais publicados concretiza qual princípio?',1,'O acesso torna os atos conhecidos e fiscalizáveis.'],
  ['Simplificar um processo para prestar o mesmo serviço em menos tempo favorece…',2,'O serviço melhora o uso do tempo sem perder qualidade.'],
  ['Respeitar as competências fixadas por lei expressa qual princípio?',3,'As competências delimitam legalmente a atuação do agente.']
]);
bank('cidadania-1', ['Adequada','Inadequada'], [
  ['Para dar transparência a um concurso, o órgão publica o edital no canal oficial. A conduta é…',0,'Os interessados podem conhecer as regras.'],
  ['Um órgão classifica todos os gastos como secretos sem fundamento. A medida é…',1,'Restrições à publicidade exigem fundamento.'],
  ['Ao divulgar despesas, um órgão protege dados pessoais desnecessários. A medida é…',0,'Transparência e proteção de dados podem coexistir.'],
  ['A lista pública de aprovados inclui senhas de acesso dos candidatos. A divulgação é…',1,'Senhas devem ser protegidas e não são necessárias para o controle do resultado.'],
  ['Uma retificação do edital é divulgada pelo canal oficial previsto. A medida é…',0,'Os interessados podem consultar a alteração.'],
  ['Uma comissão entrega os critérios públicos apenas a seus amigos. A conduta é…',1,'A divulgação seletiva compromete o acesso igual à informação.'],
  ['Um portal apresenta gastos públicos em formato consultável. A medida é…',0,'Facilitar a consulta ajuda o controle social.'],
  ['A prefeitura esconde um contrato público apenas para evitar críticas. A conduta é…',1,'Evitar críticas não é fundamento legal de sigilo.']
]);
bank('ciencias-0', ['Produtor','Consumidor','Decompositor'], [
  ['Qual o papel do capim na cadeia capim → boi?',0,'O capim produz matéria orgânica por fotossíntese.'],
  ['Que papel desempenha o gafanhoto ao comer folhas?',1,'Obtém matéria e energia de outro ser vivo.'],
  ['Um fungo degrada folhas mortas. Qual o papel descrito?',2,'Degrada matéria orgânica e participa da reciclagem de nutrientes.'],
  ['Uma alga usa luz e gás carbônico para fabricar açúcares. Ela atua como…',0,'Produz compostos orgânicos a partir de carbono inorgânico.'],
  ['Uma ave se alimenta de insetos. Qual seu papel nessa cadeia?',1,'Alimenta-se de outros organismos.'],
  ['Uma bactéria degrada restos de um tronco. Qual papel exerce?',2,'A degradação dos restos é decomposição.'],
  ['Uma árvore transforma energia luminosa em energia química. Qual é seu papel?',0,'A fotossíntese sustenta a produção primária.'],
  ['Uma onça obtém energia ao caçar uma capivara. Qual o papel da onça?',1,'É consumidora de matéria orgânica produzida por outros seres vivos.']
]);

const quantities = [40, 60, 80, 120, 140, 160, 180, 200, 240, 300, 400, 500];
function numeric(key, make) {
  banks[key] = quantities.map((n,i) => {
    const [prompt, value, why] = make(n,i);
    const answers = [value, value + 5, value + 10];
    return { prompt, choices: answers.map(v => v.toLocaleString('pt-BR')), answer: 0, why };
  });
}
numeric('numeros-0', (n,i) => {
  const rate = [10,20,25,50][i%4];
  return ['De ' + n + ' questões, quantas correspondem a ' + rate + '%?', n*rate/100, 'Multiplique ' + n + ' por ' + rate + ' e divida por 100.'];
});
numeric('numeros-1', n => ['Um produto de R$ ' + n + ' sobe 20% e depois recebe desconto de 10%. Qual o novo preço em reais?', n*108/100, 'Os fatores se multiplicam: 1,20 × 0,90 = 1,08.']);
numeric('ciencias-1', (n,i) => {
  const rate = [10,20,5][i%3];
  return ['Um nível trófico armazena ' + n + ' kJ. Com transferência de ' + rate + '%, quantos kJ chegam ao seguinte?', n*rate/100, 'A energia transferida é a fração indicada da energia disponível.'];
});

export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function newRound(pool, previous = []) {
  const fresh = pool.filter(q => !previous.includes(q.prompt));
  return shuffle(fresh).slice(0, 4).map(q => {
    const choices = shuffle(q.choices);
    return { ...q, choices, answer: choices.indexOf(q.choices[q.answer]) };
  });
}
export function practicePool(unit) {
  return unit.questions || [unit.practice, ...banks[unit.baseKey]];
}

// Fallback editorial para matérias mencionadas no conteúdo programático.
const topicPatterns = {
  'leitura-0': /conectivos?|conjunções|coesão textual/i,
  'leitura-1': /interpretação (?:de textos?|textual)|compreensão (?:de textos?|textual)|língua portuguesa|português/i,
  'numeros-0': /porcentagem|percentuais|percentagens/i,
  'numeros-1': /variações percentuais|aumentos e descontos/i,
  'logica-0': /lógica proposicional|raciocínio lógico|proposições/i,
  'logica-1': /negação|quantificadores/i,
  'cidadania-0': /princípios (?:constitucionais )?(?:da )?administração pública/i,
  'cidadania-1': /publicidade administrativa|transparência pública/i,
  'ciencias-0': /cadeias? alimentares?|cadeia alimentar|níveis tróficos/i,
  'ciencias-1': /pirâmides? (?:ecológicas?|de energia)/i
};
export function matchingTopics(syllabus) {
  return Object.entries(topicPatterns).flatMap(([key, pattern]) => {
    const match = syllabus.match(pattern);
    return match ? [{ key, citation: match[0], questions: banks[key] }] : [];
  });
}
