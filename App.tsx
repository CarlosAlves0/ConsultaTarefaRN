/**
 * ConsultaTarefas
 * Consome o recurso /todos do JSONPlaceholder (GET) e, no desafio adicional,
 * envia um POST para /posts. Tudo em um único arquivo, em TypeScript.
 *
 * Estrutura do arquivo:
 *   1) Tipos e constantes (C no topo para evitar erros de referência)
 *   2) Funções de acesso à API
 *   3) Tela de tarefas (GET, busca, filtro, FlatList)
 *   4) Tela de novo post (POST, desafio adicional)
 *   5) App (navegação por abas)
 *   6) Estilos
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

/* ================================================================== */
/* 1) TIPOS E CONSTANTES (DEVE FICAR NO TOPO)                         */
/* ================================================================== */

const C = {
  bg: '#EEF2F1',
  ink: '#12332E',
  muted: '#5C7570',
  card: '#FFFFFF',
  accent: '#0F766E',
  line: '#B7C7C4',
  ok: '#1B7F4B',
  okFundo: '#E0F3E8',
  pendente: '#A65A00',
  pendenteFundo: '#FDEFD9',
  erro: '#C62828',
  erroFundo: '#FDECEA',
} as const;

type Tarefa = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

type Filtro = 'todas' | 'concluidas' | 'pendentes';
type Aba = 'tarefas' | 'novoPost';

type PostResposta = {
  id: number;
  title: string;
  body: string;
  userId: number;
};

const URL_BASE = 'https://jsonplaceholder.typicode.com';
const URL_TAREFAS = `${URL_BASE}/todos?_limit=20`;
const URL_POSTS = `${URL_BASE}/posts`;

const FILTROS: { chave: Filtro; rotulo: string }[] = [
  { chave: 'todas', rotulo: 'Todas' },
  { chave: 'concluidas', rotulo: 'Concluídas' },
  { chave: 'pendentes', rotulo: 'Pendentes' },
];

/* ================================================================== */
/* 2) ACESSO À API                                                    */
/* ================================================================== */

async function buscarTarefas(): Promise<Tarefa[]> {
  let resposta: Response;
  try {
    resposta = await fetch(URL_TAREFAS);
  } catch {
    throw new Error('Não foi possível conectar. Verifique sua internet e tente novamente.');
  }

  if (!resposta.ok) {
    throw new Error(`O servidor respondeu com erro (código ${resposta.status}). Tente novamente em instantes.`);
  }

  const dados: Tarefa[] = await resposta.json();
  return dados;
}

async function enviarPost(titulo: string, texto: string): Promise<PostResposta> {
  let resposta: Response;
  try {
    resposta = await fetch(URL_POSTS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ title: titulo, body: texto, userId: 1 }),
    });
  } catch {
    throw new Error('Não foi possível conectar. Verifique sua internet e tente novamente.');
  }

  if (!resposta.ok) {
    throw new Error(`O servidor respondeu com erro (código ${resposta.status}).`);
  }

  const dados: PostResposta = await resposta.json();
  return dados;
}

/* ================================================================== */
/* 3) TELA DE TAREFAS                                                 */
/* ================================================================== */

function TelaTarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string>('');
  const [busca, setBusca] = useState<string>('');
  const [filtro, setFiltro] = useState<Filtro>('todas');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const dados = await buscarTarefas();
      setTarefas(dados);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Ocorreu um erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const tarefasVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return tarefas.filter((t) => {
      const combinaTitulo = t.title.toLowerCase().includes(termo);
      const combinaFiltro =
        filtro === 'todas' ||
        (filtro === 'concluidas' && t.completed) ||
        (filtro === 'pendentes' && !t.completed);
      return combinaTitulo && combinaFiltro;
    });
  }, [tarefas, busca, filtro]);

  if (carregando) {
    return (
      <View style={s.centro}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={s.textoApoio}>Carregando tarefas…</Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={s.centro}>
        <Text style={s.erroTitulo}>Não foi possível carregar</Text>
        <Text style={[s.textoApoio, { textAlign: 'center' }]}>{erro}</Text>
        <Pressable
          onPress={carregar}
          accessibilityRole="button"
          style={({ pressed }) => [s.btn, { marginTop: 16 }, pressed && { opacity: 0.8 }]}
        >
          <Text style={s.btnTexto}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        value={busca}
        onChangeText={setBusca}
        placeholder="Pesquisar pelo título"
        placeholderTextColor="#8A9A97"
        style={s.input}
        autoCorrect={false}
      />

      <View style={s.filtros}>
        {FILTROS.map((f) => {
          const ativo = filtro === f.chave;
          return (
            <Pressable
              key={f.chave}
              onPress={() => setFiltro(f.chave)}
              style={[s.chip, ativo && s.chipAtivo]}
            >
              <Text style={[s.chipTexto, ativo && s.chipTextoAtivo]}>{f.rotulo}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={s.contador}>{tarefasVisiveis.length} de {tarefas.length} tarefas</Text>

      <FlatList
        data={tarefasVisiveis}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={[s.item, { borderLeftColor: item.completed ? C.ok : C.pendente }]}>
            <Text style={[s.itemTitulo, item.completed && s.itemTituloConcluido]}>{item.title}</Text>
            <View style={[s.selo, { backgroundColor: item.completed ? C.okFundo : C.pendenteFundo }]}>
              <Text style={[s.seloTexto, { color: item.completed ? C.ok : C.pendente }]}>{item.completed ? '✓ Concluída' : '○ Pendente'}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.vazio}>
            <Text style={s.vazioTitulo}>Nenhuma tarefa encontrada</Text>
            <Text style={[s.textoApoio, { textAlign: 'center' }]}>Mude a pesquisa ou escolha outro filtro.</Text>
          </View>
        }
      />
    </View>
  );
}

/* ================================================================== */
/* 4) TELA DE NOVO POST (DESAFIO ADICIONAL)                           */
/* ================================================================== */

function TelaNovoPost() {
  const [titulo, setTitulo] = useState<string>('');
  const [texto, setTexto] = useState<string>('');
  const [enviando, setEnviando] = useState<boolean>(false);
  const [erro, setErro] = useState<string>('');
  const [resposta, setResposta] = useState<PostResposta | null>(null);

  const enviar = async () => {
    setErro('');
    setResposta(null);

    if (titulo.trim() === '' || texto.trim() === '') {
      setErro('Preencha o título e o texto antes de enviar.');
      return;
    }

    setEnviando(true);
    try {
      const dados = await enviarPost(titulo.trim(), texto.trim());
      setResposta(dados);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Ocorreu um erro inesperado.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <Text style={s.rotulo}>Título</Text>
      <TextInput
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Título do post"
        placeholderTextColor="#8A9A97"
        style={s.input}
      />

      <Text style={s.rotulo}>Texto</Text>
      <TextInput
        value={texto}
        onChangeText={setTexto}
        placeholder="Escreva o texto do post"
        placeholderTextColor="#8A9A97"
        style={[s.input, { minHeight: 100, textAlignVertical: 'top' }]}
        multiline
      />

      <Pressable
        onPress={enviar}
        disabled={enviando}
        style={({ pressed }) => [s.btn, (pressed || enviando) && { opacity: 0.7 }]}
      >
        {enviando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={s.btnTexto}>Enviar post</Text>
        )}
      </Pressable>

      {erro ? (
        <View style={s.caixaErro}>
          <Text style={{ color: C.erro, fontSize: 15 }}>{erro}</Text>
        </View>
      ) : null}

      {resposta ? (
        <View style={{ marginTop: 18 }}>
          <Text style={s.rotulo}>JSON retornado pela API</Text>
          <View style={s.json}>
            <Text style={s.jsonTexto}>{JSON.stringify(resposta, null, 2)}</Text>
          </View>

          <View style={s.explicacao}>
            <Text style={s.explicacaoTitulo}>Por que o registro não fica armazenado?</Text>
            <Text style={s.explicacaoTexto}>O JSONPlaceholder é uma API de teste (fake). Ao receber o POST, ela devolve um objeto comum id novo e o status 201 para simular uma criação bem-sucedida, mas não grava nada em banco de dados.</Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

/* ================================================================== */
/* 5) APP (NAVEGAÇÃO POR ABAS)                                        */
/* ================================================================== */

export default function App() {
  const [aba, setAba] = useState<Aba>('tarefas');

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />

      <View style={s.container}>
        <Text style={s.titulo}>{aba === 'tarefas' ? 'Tarefas' : 'Novo post'}</Text>

        <View style={[{ flex: 1 }, aba !== 'tarefas' && { display: 'none' }]}>
          <TelaTarefas />
        </View>
        <View style={[{ flex: 1 }, aba !== 'novoPost' && { display: 'none' }]}>
          <TelaNovoPost />
        </View>
      </View>

      <View style={s.abas}>
        {(['tarefas', 'novoPost'] as Aba[]).map((chave) => {
          const ativa = aba === chave;
          const rotulo = chave === 'tarefas' ? 'Tarefas' : 'Novo post';
          return (
            <Pressable
              key={chave}
              onPress={() => setAba(chave)}
              style={[s.aba, ativa && s.abaAtiva]}
            >
              <Text style={[s.abaTexto, ativa && s.abaTextoAtiva]}>{rotulo}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

/* ================================================================== */
/* 6) ESTILOS                                                         */
/* ================================================================== */

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 12 },
  titulo: { fontSize: 28, fontWeight: '800', color: C.ink, marginBottom: 12 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  textoApoio: { fontSize: 15, color: C.muted, marginTop: 10, lineHeight: 21 },
  erroTitulo: { fontSize: 20, fontWeight: '700', color: C.erro },
  rotulo: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: C.ink,
    backgroundColor: C.card,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  filtros: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.line,
    backgroundColor: C.card,
  },
  chipAtivo: { backgroundColor: C.accent, borderColor: C.accent },
  chipTexto: { fontSize: 14, fontWeight: '600', color: C.ink },
  chipTextoAtivo: { color: '#FFFFFF' },
  contador: { fontSize: 13, color: C.muted, marginBottom: 8 },
  item: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 6,
    borderWidth: 1,
    borderColor: C.line,
  },
  itemTitulo: { fontSize: 16, color: C.ink, lineHeight: 22 },
  itemTituloConcluido: { textDecorationLine: 'line-through', color: C.muted },
  selo: { alignSelf: 'flex-start', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, marginTop: 10 },
  seloTexto: { fontSize: 13, fontWeight: '700' },
  vazio: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  vazioTitulo: { fontSize: 18, fontWeight: '700', color: C.ink },
  caixaErro: { backgroundColor: C.erroFundo, borderRadius: 10, padding: 12, marginTop: 14 },
  json: { backgroundColor: '#12332E', borderRadius: 10, padding: 14 },
  jsonTexto: {
    color: '#D8F3EC',
    fontSize: 13,
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Menlo',
  },
  explicacao: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  explicacaoTitulo: { fontSize: 16, fontWeight: '700', color: C.ink, marginBottom: 6 },
  explicacaoTexto: { fontSize: 14, color: C.ink, lineHeight: 21 },
  abas: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.card },
  aba: { flex: 1, paddingVertical: 14, alignItems: 'center', borderTopWidth: 3, borderTopColor: 'transparent' },
  abaAtiva: { borderTopColor: C.accent },
  abaTexto: { fontSize: 15, fontWeight: '600', color: C.muted },
  abaTextoAtiva: { color: C.accent },
});
