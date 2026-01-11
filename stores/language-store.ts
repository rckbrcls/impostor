"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Language = "pt" | "en";

export const translations = {
  pt: {
    "footer.made_by": "feito por",
    "language.switch": "Mudar para Inglês",

    // Header
    "header.menu": "Menu",
    "header.toggle_menu": "Alternar menu",
    "header.nav_desc": "Menu de navegação",
    "header.home": "Início",

    // Common
    "common.back": "Voltar",
    "common.or": "ou",
    "common.copied": "Copiado!",
    "common.copy_link": "Copiar Link",
    "common.loading": "Carregando...",
    "common.error": "Erro",
    "common.you": "(você)",

    // Home
    "home.title": "Impostor",
    "home.subtitle": "Descubra quem é o impostor entre seus amigos!",
    "home.create_room": "Criar Nova Sala",
    "home.join_room": "Entrar em uma Sala",

    // Create Room
    "create_room.title": "Criar Nova Sala",
    "create_room.subtitle": "Crie uma sala e convide seus amigos para jogar",
    "create_room.success_title": "Sala Criada!",
    "create_room.success_desc": "Compartilhe o código com seus amigos",
    "create_room.room_code": "Código da Sala",
    "create_room.button_create": "Criar Sala",
    "create_room.button_creating": "Criando...",
    "create_room.button_enter": "Entrar na Sala",
    "create_room.label_name": "Seu Nome",
    "create_room.placeholder_name": "Digite seu nome",

    // Join Room
    "join_room.title": "Entrar em uma Sala",
    "join_room.subtitle": "Digite o código da sala e seu nome",
    "join_room.placeholder_code": "Código da sala",
    "join_room.placeholder_name": "Seu nome",
    "join_room.button_join": "Entrar na Sala",
    "join_room.button_joining": "Entrando...",
    "join_room.error_not_found": "Sala não encontrada",
    "join_room.error_started": "Esta sala já está em jogo",
    "join_room.error_generic": "Erro ao entrar na sala",

    // Lobby
    "lobby.room": "Sala",
    "lobby.ready": "Pronto para começar!",
    "lobby.waiting": "Aguardando jogadores... ({0}/{1} mínimo)",
    "lobby.players_title": "Jogadores ({0})",
    "lobby.share": "Compartilhar",
    "lobby.start": "Começar",
    "lobby.starting": "Iniciando...",
    "lobby.waiting_host": "Aguardando o host iniciar o jogo...",
    "lobby.leave": "Sair da Sala",
    "lobby.leaving": "Saindo...",

    // Game
    "game.round": "Rodada {0}",
    "game.players_count": "{0} jogadores",
    "game.impostor_title": "VOCÊ É O IMPOSTOR!",
    "game.impostor_desc": "Descubra a palavra sem ser pego!",
    "game.word_label": "A palavra é:",
    "game.word_desc": "Descreva sem falar a palavra!",
    "game.players_round": "Jogadores na rodada",
    "game.start_voting": "Iniciar Votação",
    "game.starting_voting": "Iniciando...",
    "game.waiting_host_vote": "Aguarde o host iniciar a votação...",
    "game.eliminated": "Eliminado",
    "game.ready_to_vote": "Pronto para Votar",

    // Voting
    "voting.title": "Rodada {0} - Votação",
    "voting.desc_reveal": "Resultado da votação",
    "voting.desc_ask": "Quem você acha que é o impostor?",
    "voting.most_voted_label": "O mais votado foi:",
    "voting.result_impostor": "ERA O IMPOSTOR! Vocês venceram!",
    "voting.result_innocent": "Foi eliminado! Não era o impostor.",
    "voting.result_selected": "Foi selecionado pela maioria!",
    "voting.no_votes": "Ninguém foi votado como impostor",
    "voting.processing": "Processando votos...",
    "voting.next_round": "Ir para Próxima Rodada",
    "voting.end_game": "Finalizar Jogo",
    "voting.waiting_host_continue": "Aguardando o host continuar...",
    "voting.choose_option": "Escolha UMA opção:",
    "voting.vote_impostor_label": "Votar em quem você acha que é o impostor:",
    "voting.vote_count": "{0} voto{1}",
    "voting.option_next_round": "Próxima rodada",
    "voting.option_end_game": "Finalizar jogo",
    "voting.button_confirm": "Confirmar Voto",
    "voting.button_sending": "Enviando...",
    "voting.confirmed": "Voto registrado!",
    "voting.waiting_players": "Aguardando: {0}",
    "voting.progress": "({0}/{1} votos)",
    "voting.all_voted": "Todos votaram! Processando resultados...",

    // Vote Conclusion
    "vote_conclusion.title": "Conclusão do Voto",
    "vote_conclusion.subtitle": "Veja se o seu voto foi correto",
    "vote_conclusion.you_voted_for": "Você votou em:",
    "vote_conclusion.impostor_found": "ERA O IMPOSTOR!",
    "vote_conclusion.not_impostor": "NÃO era o impostor.",
    "vote_conclusion.skipped_or_action":
      "Você pulou ou votou para pular/encerrar.",
    "vote_conclusion.continue_to_results": "Continuar para Resultados",
    "vote_conclusion.waiting_for_host": "Aguardando o host continuar...",

    // Results
    "results.impostor_won": "O Impostor Venceu!",
    "results.players_won": "Jogadores Venceram!",
    "results.rounds_played": "{0} rodada{1} jogada{1}",
    "results.word_was": "A palavra era:",
    "results.impostor_was": "O impostor era:",
    "results.survived_rounds": "Sobreviveu por {0} rodada{1}!",
    "results.eliminated_title": "Eliminados durante o jogo:",
    "results.home": "Início",
    "results.play_again": "Jogar Novamente",
    "results.unknown": "Desconhecido",
    "results.ranking_title": "Ranking Final",
    "results.session_ended": "Sessão encerrada",
    "results.end_session": "Encerrar Sessão",

    // Session Ended
    "session.title": "Sessão Encerrada",
    "session.subtitle": "Estatísticas finais da sessão",
    "session.best_detective": "Melhor Detetive",
    "session.best_detective_desc": "Mais votos corretos no impostor",
    "session.master_of_disguise": "Mestre do Disfarce",
    "session.master_of_disguise_desc": "Mais rounds sobrevividos como impostor",
    "session.most_indecisive": "Mais Indeciso",
    "session.most_indecisive_desc": "Mais votos para passar rodada",
    "session.most_suspicious": "Mais Suspeito",
    "session.most_suspicious_desc": "Mais vezes eliminado",
    "session.most_accused": "Mais Acusado",
    "session.most_accused_desc": "Mais votos recebidos",
    "session.stats_table": "Estatísticas Detalhadas",
    "session.player": "Jogador",
    "session.correct_votes": "Votos Corretos",
    "session.correct_votes_short": "acertos",
    "session.rounds_survived": "Rounds Sobrevividos",
    "session.rounds_short": "rounds",
    "session.times_impostor": "Impostor",
    "session.passed_rounds": "Pulados",
    "session.skips_short": "skips",
    "session.times_eliminated": "Eliminado",
    "session.eliminations_short": "x",
    "session.votes_received": "Votos",
    "session.votes_short": "votos",
    "session.games_played": "Partidas",

    // About
    "about.title": "Sobre o Jogo",
    "about.subtitle":
      "Duplizen é um jogo de dedução social multiplayer onde você precisa descobrir quem é o impostor entre seus amigos!",
    "about.what_is_title": "O que é Duplizen?",
    "about.what_is_desc":
      "Duplizen é um jogo de festa para grupos de amigos. Uma pessoa é escolhida aleatoriamente como o impostor e não sabe qual é a palavra secreta. Os outros jogadores precisam descobrir quem é o impostor fazendo perguntas e observando as respostas, enquanto o impostor tenta se passar despercebido.",
    "about.how_to_play": "Como Jogar",
    "about.step1_title": "Crie uma Sala",
    "about.step1_desc":
      "Crie uma sala e compartilhe o código com seus amigos para que eles possam entrar.",
    "about.step2_title": "Receba Sua Função",
    "about.step2_desc":
      "Cada jogador recebe uma função: cidadão (com a palavra secreta) ou impostor (sem a palavra).",
    "about.step3_title": "Discuta",
    "about.step3_desc":
      "Todos descrevem a palavra de forma vaga. O impostor tenta se misturar sem saber a palavra.",
    "about.step4_title": "Vote",
    "about.step4_desc":
      "Vote em quem você acha que é o impostor. Se acertarem, os cidadãos vencem!",
    "about.features_title": "Características",
    "about.feature1_title": "Dedução Social",
    "about.feature1_desc":
      "Use suas habilidades de observação para identificar o impostor.",
    "about.feature2_title": "Blefe",
    "about.feature2_desc":
      "Como impostor, engane os outros para sobreviver às votações.",
    "about.feature3_title": "Ranking",
    "about.feature3_desc":
      "Ganhe pontos por votos corretos e conquiste títulos especiais.",
    "about.cta_title": "Pronto para jogar?",
  },
  en: {
    "footer.made_by": "made by",
    "language.switch": "Switch to Portuguese",

    // Header
    "header.menu": "Menu",
    "header.toggle_menu": "Toggle menu",
    "header.nav_desc": "Navigation menu",
    "header.home": "Home",

    // Common
    "common.back": "Back",
    "common.or": "or",
    "common.copied": "Copied!",
    "common.copy_link": "Copy Link",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.you": "(you)",

    // Home
    "home.title": "Impostor",
    "home.subtitle": "Find the impostor among your friends!",
    "home.create_room": "Create New Room",
    "home.join_room": "Join a Room",

    // Create Room
    "create_room.title": "Create New Room",
    "create_room.subtitle": "Create a room and invite your friends to play",
    "create_room.success_title": "Room Created!",
    "create_room.success_desc": "Share the code with your friends",
    "create_room.room_code": "Room Code",
    "create_room.button_create": "Create Room",
    "create_room.button_creating": "Creating...",
    "create_room.button_enter": "Enter Room",
    "create_room.label_name": "Your Name",
    "create_room.placeholder_name": "Enter your name",

    // Join Room
    "join_room.title": "Join a Room",
    "join_room.subtitle": "Enter the room code and your name",
    "join_room.placeholder_code": "Room code",
    "join_room.placeholder_name": "Your name",
    "join_room.button_join": "Join Room",
    "join_room.button_joining": "Joining...",
    "join_room.error_not_found": "Room not found",
    "join_room.error_started": "This room is already playing",
    "join_room.error_generic": "Error joining room",

    // Lobby
    "lobby.room": "Room",
    "lobby.ready": "Ready to start!",
    "lobby.waiting": "Waiting for players... ({0}/{1} min)",
    "lobby.players_title": "Players ({0})",
    "lobby.share": "Share",
    "lobby.start": "Start",
    "lobby.starting": "Starting...",
    "lobby.waiting_host": "Waiting for host to start the game...",
    "lobby.leave": "Leave Room",
    "lobby.leaving": "Leaving...",

    // Game
    "game.round": "Round {0}",
    "game.players_count": "{0} players",
    "game.impostor_title": "YOU ARE THE IMPOSTOR!",
    "game.impostor_desc": "Find the word without getting caught!",
    "game.word_label": "The word is:",
    "game.word_desc": "Describe without saying the word!",
    "game.players_round": "Players in this round",
    "game.start_voting": "Start Voting",
    "game.starting_voting": "Starting...",
    "game.waiting_host_vote": "Wait for host to start voting...",
    "game.eliminated": "Eliminated",
    "game.ready_to_vote": "Ready to Vote",

    // Voting
    "voting.title": "Round {0} - Voting",
    "voting.desc_reveal": "Voting Results",
    "voting.desc_ask": "Who do you think is the impostor?",
    "voting.most_voted_label": "The most voted was:",
    "voting.result_impostor": "WAS THE IMPOSTOR! You won!",
    "voting.result_innocent": "Was eliminated! Was not the impostor.",
    "voting.result_selected": "Was selected by majority!",
    "voting.no_votes": "No one was voted as impostor",
    "voting.processing": "Processing votes...",
    "voting.next_round": "Go to Next Round",
    "voting.end_game": "End Game",
    "voting.waiting_host_continue": "Waiting for host to continue...",
    "voting.choose_option": "Choose ONE option:",
    "voting.vote_impostor_label": "Vote for who you think is the impostor:",
    "voting.vote_count": "{0} vote{1}",
    "voting.option_next_round": "Next Round",
    "voting.option_end_game": "End Game",
    "voting.button_confirm": "Confirm Vote",
    "voting.button_sending": "Sending...",
    "voting.confirmed": "Vote registered!",
    "voting.waiting_players": "Waiting: {0}",
    "voting.progress": "({0}/{1} votes)",
    "voting.all_voted": "All voted! Processing results...",

    // Vote Conclusion
    "vote_conclusion.title": "Vote Conclusion",
    "vote_conclusion.subtitle": "See if your vote was correct",
    "vote_conclusion.you_voted_for": "You voted for:",
    "vote_conclusion.impostor_found": "WAS THE IMPOSTOR!",
    "vote_conclusion.not_impostor": "Was NOT the impostor.",
    "vote_conclusion.skipped_or_action": "You skipped or voted for action.",
    "vote_conclusion.continue_to_results": "Continue to Results",
    "vote_conclusion.waiting_for_host": "Waiting for host to continue...",

    // Results
    "results.impostor_won": "The Impostor Won!",
    "results.players_won": "Players Won!",
    "results.rounds_played": "{0} round{1} played",
    "results.word_was": "The word was:",
    "results.impostor_was": "The impostor was:",
    "results.survived_rounds": "Survived for {0} round{1}!",
    "results.eliminated_title": "Eliminated during the game:",
    "results.home": "Home",
    "results.play_again": "Play Again",
    "results.unknown": "Unknown",
    "results.ranking_title": "Final Ranking",
    "results.session_ended": "Session Ended",
    "results.end_session": "End Session",

    // Session Ended
    "session.title": "Session Ended",
    "session.subtitle": "Final session statistics",
    "session.best_detective": "Best Detective",
    "session.best_detective_desc": "Most correct votes on impostor",
    "session.master_of_disguise": "Master of Disguise",
    "session.master_of_disguise_desc": "Most rounds survived as impostor",
    "session.most_indecisive": "Most Indecisive",
    "session.most_indecisive_desc": "Most votes to skip round",
    "session.most_suspicious": "Most Suspicious",
    "session.most_suspicious_desc": "Most times eliminated",
    "session.most_accused": "Most Accused",
    "session.most_accused_desc": "Most votes received",
    "session.stats_table": "Detailed Statistics",
    "session.player": "Player",
    "session.correct_votes": "Correct Votes",
    "session.correct_votes_short": "hits",
    "session.rounds_survived": "Rounds Survived",
    "session.rounds_short": "rounds",
    "session.times_impostor": "Impostor",
    "session.passed_rounds": "Skipped",
    "session.skips_short": "skips",
    "session.times_eliminated": "Eliminated",
    "session.eliminations_short": "x",
    "session.votes_received": "Votes",
    "session.votes_short": "votes",
    "session.games_played": "Games",

    // About
    "about.title": "About the Game",
    "about.subtitle":
      "Duplizen is a multiplayer social deduction game where you need to find the impostor among your friends!",
    "about.what_is_title": "What is Duplizen?",
    "about.what_is_desc":
      "Duplizen is a party game for groups of friends. One person is randomly chosen as the impostor and doesn't know the secret word. Other players must figure out who the impostor is by asking questions and observing answers, while the impostor tries to blend in.",
    "about.how_to_play": "How to Play",
    "about.step1_title": "Create a Room",
    "about.step1_desc":
      "Create a room and share the code with your friends so they can join.",
    "about.step2_title": "Get Your Role",
    "about.step2_desc":
      "Each player receives a role: citizen (with the secret word) or impostor (without the word).",
    "about.step3_title": "Discuss",
    "about.step3_desc":
      "Everyone describes the word vaguely. The impostor tries to blend in without knowing the word.",
    "about.step4_title": "Vote",
    "about.step4_desc":
      "Vote for who you think is the impostor. If correct, the citizens win!",
    "about.features_title": "Features",
    "about.feature1_title": "Social Deduction",
    "about.feature1_desc":
      "Use your observation skills to identify the impostor.",
    "about.feature2_title": "Bluffing",
    "about.feature2_desc": "As impostor, deceive others to survive the votes.",
    "about.feature3_title": "Ranking",
    "about.feature3_desc":
      "Earn points for correct votes and unlock special titles.",
    "about.cta_title": "Ready to play?",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, ...args: (string | number)[]) => string;
}

const getTranslation = (
  language: Language,
  key: TranslationKey,
  args: (string | number)[],
) => {
  let translation: string = translations[language][key] || key;
  args.forEach((arg, index) => {
    translation = translation.replace(`{${index}}`, String(arg));
  });
  return translation;
};

const useBaseLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "en",
      setLanguage: (lang: Language) => set({ language: lang }),
      t: (key: TranslationKey, ...args: (string | number)[]) => {
        const { language } = get();
        return getTranslation(language, key, args);
      },
    }),
    {
      name: "language-storage",
    },
  ),
);

import { useState, useEffect } from "react";

export const useLanguage = () => {
  const store = useBaseLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return {
      ...store,
      language: "en" as Language,
      t: (key: TranslationKey, ...args: (string | number)[]) =>
        getTranslation("en", key, args),
    };
  }

  return store;
};
