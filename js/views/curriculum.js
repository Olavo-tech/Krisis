// Questões autorais. Cada etapa inclui uma explicação, um exemplo e uma prática diferente do diagnóstico.
const question = (prompt, choices, answer, why) => ({ prompt, choices, answer, why });
const lesson = (title, text, example, practice) => ({ title, text, example, practice });

export const subjects = {
  leitura: {
    name: 'Português', icon: 'book',
    test: [
      question('“O prazo terminou, porém a lista continua disponível.” Qual ideia “porém” expressa?', ['Causa', 'Contraste', 'Conclusão'], 1),
      question('“Só serão chamados candidatos classificados.” O que se pode concluir?', ['Todo classificado será chamado', 'Todos serão chamados', 'Quem for chamado estará classificado'], 2),
      question('“Embora estivesse cansada, Ana revisou o texto.” O cansaço é apresentado como…', ['Uma consequência da revisão', 'Um obstáculo que não impediu a revisão', 'Uma ordem para revisar'], 1)
    ],
    lessons: [
      lesson('Entender os conectivos', 'Conectivos mostram como duas ideias se relacionam. “Porque” introduz uma causa. “Mas” e “porém” marcam contraste.', 'Em “estudei, mas ainda tenho dúvidas”, a segunda ideia contraria uma expectativa da primeira.', question('“A inscrição foi aceita porque chegou no prazo.” A segunda parte indica…', ['Uma condição', 'Uma causa', 'Um contraste'], 1, 'Chegar no prazo explica por que a inscrição foi aceita.')),
      lesson('Ler nas entrelinhas', 'Uma inferência precisa respeitar os limites do texto. “Apenas” restringe um grupo, mas não garante o que acontecerá com cada integrante.', '“Apenas inscritos podem entrar” exclui quem não se inscreveu. Não garante a entrada de todos os inscritos.', question('“Só textos inéditos podem concorrer.” Qual afirmação é segura?', ['Todo texto inédito vence', 'Textos publicados podem concorrer', 'Um texto já publicado fica de fora'], 2, 'Ser inédito é necessário para concorrer. Isso não garante a vitória.'))
    ]
  },
  numeros: {
    name: 'Matemática', icon: 'calc',
    test: [
      question('Quanto é 15% de 200?', ['15', '30', '45'], 1),
      question('Uma taxa de R$ 100 sobe 10% e depois cai 10%. Quanto fica?', ['R$ 100', 'R$ 90', 'R$ 99'], 2),
      question('Uma turma passou de 40 para 50 pessoas. Qual foi o aumento percentual?', ['10%', '20%', '25%'], 2)
    ],
    lessons: [
      lesson('Calcular porcentagens', 'Uma porcentagem é uma fração com denominador 100. Para calcular uma parte, multiplique o total pela taxa dividida por 100.', 'Em 80 questões, 25% correspondem a 80 × 25 ÷ 100 = 20 questões.', question('Uma prova tem 60 questões. Quantas correspondem a 20%?', ['12', '20', '30'], 0, '60 × 0,20 = 12 questões.')),
      lesson('Comparar variações', 'Em mudanças sucessivas, cada percentual incide sobre o valor atualizado. Use um fator para cada mudança.', 'Um aumento de 20% seguido de desconto de 20% multiplica o valor por 1,2 × 0,8 = 0,96.', question('Um livro de R$ 50 sobe 20% e depois recebe desconto de 10%. Qual é o preço final?', ['R$ 55', 'R$ 54', 'R$ 60'], 1, 'Primeiro, 50 × 1,2 = 60. Depois, 60 × 0,9 = 54.'))
    ]
  },
  logica: {
    name: 'Raciocínio lógico', icon: 'brain',
    test: [
      question('Quando “P e Q” é verdadeira?', ['Quando ambas são verdadeiras', 'Quando uma só é verdadeira', 'Sempre'], 0),
      question('Qual é a negação de “todos os relatórios estão prontos”?', ['Nenhum está pronto', 'Pelo menos um não está pronto', 'Algum está pronto'], 1),
      question('Se chover, a oficina será adiada. A oficina aconteceu na data prevista. O que decorre da regra?', ['Não choveu', 'Choveu', 'Toda oficina acontece sem chuva'], 0)
    ],
    lessons: [
      lesson('Combinar condições', 'Uma conjunção liga condições com “e”. Para a frase inteira ser verdadeira, cada condição precisa ser verdadeira.', 'Se a regra exige “inscrição e documento”, apresentar só o documento deixa a regra incompleta.', question('A senha precisa de letra e número. Qual opção atende?', ['abc', '123', 'abc2'], 2, 'A última opção contém os dois tipos de caractere.')),
      lesson('Negar uma afirmação', 'Negar uma afirmação é descrever exatamente quando ela falha. Um único contraexemplo derruba uma afirmação universal.', 'A negação de “todos chegaram cedo” é “alguém não chegou cedo”.', question('Qual frase nega “nenhuma ficha está assinada”?', ['Alguma ficha está assinada', 'Todas estão assinadas', 'Uma ficha está em branco'], 0, 'Uma ficha assinada basta para contradizer “nenhuma”.'))
    ]
  },
  cidadania: {
    name: 'Administração pública', icon: 'scale',
    test: [
      question('Atender sem favorecer amigos está ligado a qual princípio?', ['Publicidade', 'Impessoalidade', 'Eficiência'], 1),
      question('Por que divulgar critérios antes de uma seleção pública?', ['Para dispensar a lei', 'Para ocultar recursos', 'Para permitir acompanhamento e controle'], 2),
      question('Melhorar um atendimento para usar menos recursos com a mesma qualidade se relaciona a qual princípio?', ['Impessoalidade', 'Eficiência', 'Publicidade'], 1)
    ],
    lessons: [
      lesson('Reconhecer os princípios', 'O artigo 37 da Constituição enumera legalidade, impessoalidade, moralidade, publicidade e eficiência. A impessoalidade exige critérios voltados ao interesse público.', 'Uma fila organizada por ordem de chegada aplica um critério comum, respeitadas as prioridades previstas em lei.', question('Escolher um fornecedor só pela amizade viola mais diretamente qual princípio?', ['Impessoalidade', 'Publicidade', 'Eficiência'], 0, 'A amizade é um interesse pessoal que substitui um critério público.')),
      lesson('Aplicar a publicidade', 'A publicidade permite conhecer e fiscalizar atos administrativos. Sua aplicação também respeita os limites legais de sigilo e proteção de dados.', 'Publicar os critérios de uma seleção ajuda as pessoas a conferir o resultado, sem expor documentos pessoais desnecessários.', question('Qual medida facilita o controle de uma seleção?', ['Omitir o resultado', 'Publicar critérios e resultados conforme a lei', 'Expor dados pessoais irrelevantes'], 1, 'Critérios e resultados permitem conferir a decisão pública.'))
    ]
  },
  ciencias: {
    name: 'Ciências da natureza', icon: 'flask',
    test: [
      question('Qual é a fonte de energia usada pelas plantas na fotossíntese?', ['A luz', 'O sal', 'O oxigênio'], 0),
      question('Por que há menos energia disponível nos níveis superiores de uma cadeia alimentar?', ['Ela fica toda no solo', 'Cada nível produz luz', 'Parte é usada no metabolismo e dissipada como calor'], 2),
      question('Em uma cadeia alimentar, os fungos que decompõem restos de seres vivos contribuem para…', ['Produzir luz', 'Reciclar nutrientes', 'Criar energia nova'], 1)
    ],
    lessons: [
      lesson('Seguir a energia', 'Produtores transformam energia luminosa em energia química. Essa energia chega aos consumidores quando eles se alimentam.', 'Na cadeia capim → gafanhoto → sapo, o capim é o produtor.', question('Em algas → peixes → aves, quem capta a energia da luz?', ['As aves', 'As algas', 'Os peixes'], 1, 'As algas fazem fotossíntese e iniciam essa cadeia.')),
      lesson('Interpretar pirâmides', 'Uma pirâmide de energia representa a energia disponível por nível trófico em certo intervalo. A transferência entre níveis é parcial.', 'Se 10% de 2.000 unidades chegam ao próximo nível, ele recebe 200 unidades. A proporção real varia.', question('Se 20% de 500 unidades passam ao próximo nível, quantas chegam?', ['25', '100', '400'], 1, '500 × 0,20 = 100 unidades.'))
    ]
  }
};

export const tracks = {
  geral: { name: 'Concurso geral', subjects: ['leitura', 'numeros', 'logica'] },
  administrativo: { name: 'Área administrativa', subjects: ['leitura', 'logica', 'cidadania'] },
  vestibular: { name: 'ENEM ou vestibular', subjects: ['leitura', 'numeros', 'ciencias'] }
};
