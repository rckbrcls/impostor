"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Language = "pt" | "en";

export const translations = {
  pt: {
    "footer.made_by": "feito por",
    "language.switch": "Mudar para Inglês",

    // Common
    "common.back": "← Voltar",
    "common.or": "ou",
    "common.copied": "Copiado!",
    "common.copy_link": "Copiar Link",
    "common.loading": "Carregando...",
    "common.error": "Erro",
    "common.you": "(você)",

    // Home
    "home.title": "🕵 Impostor",
    "home.subtitle": "Descubra quem é o impostor entre seus amigos!",
    "home.create_room": "🎮 Criar Nova Sala",
    "home.join_room": "🚪 Entrar em uma Sala",

    // Create Room
    "create_room.title": "Criar Nova Sala",
    "create_room.subtitle": "Crie uma sala e convide seus amigos para jogar",
    "create_room.success_title": "Sala Criada! 🎉",
    "create_room.success_desc": "Compartilhe o código com seus amigos",
    "create_room.room_code": "Código da Sala",
    "create_room.button_create": "🎮 Criar Sala",
    "create_room.button_creating": "Criando...",
    "create_room.button_enter": "Entrar na Sala",
    "create_room.label_name": "Seu Nome",
    "create_room.placeholder_name": "Digite seu nome",

    // Join Room
    "join_room.title": "Entrar em uma Sala",
    "join_room.subtitle": "Digite o código da sala e seu nome",
    "join_room.placeholder_code": "Código da sala (ex: ABC123)",
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
    "game.eliminated": "❌",

    // Voting
    "voting.title": "Rodada {0} - Votação",
    "voting.desc_reveal": "Resultado da votação",
    "voting.desc_ask": "Quem você acha que é o impostor?",
    "voting.most_voted_label": "O mais votado foi:",
    "voting.result_impostor": "✅ ERA O IMPOSTOR! Vocês venceram!",
    "voting.result_innocent": "🚫 Foi eliminado! Não era o impostor.",
    "voting.no_votes": "Ninguém foi votado como impostor",
    "voting.processing": "Processando votos...",
    "voting.next_round": "Ir para Próxima Rodada",
    "voting.end_game": "Finalizar Jogo",
    "voting.waiting_host_continue": "Aguardando o host continuar...",
    "voting.choose_option": "Escolha UMA opção:",
    "voting.vote_impostor_label":
      "🕵️ Votar em quem você acha que é o impostor:",
    "voting.vote_count": "{0} voto{1}",
    "voting.option_next_round": "Próxima rodada",
    "voting.option_end_game": "Finalizar jogo",
    "voting.button_confirm": "Confirmar Voto",
    "voting.button_sending": "Enviando...",
    "voting.confirmed": "Voto registrado!",
    "voting.waiting_players": "Aguardando: {0}",
    "voting.progress": "({0}/{1} votos)",
    "voting.all_voted": "Todos votaram! Processando resultados...",

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
  },
  en: {
    "footer.made_by": "made by",
    "language.switch": "Switch to Portuguese",

    // Common
    "common.back": "← Back",
    "common.or": "or",
    "common.copied": "Copied!",
    "common.copy_link": "Copy Link",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.you": "(you)",

    // Home
    "home.title": "🕵 Impostor",
    "home.subtitle": "Find the impostor among your friends!",
    "home.create_room": "🎮 Create New Room",
    "home.join_room": "🚪 Join a Room",

    // Create Room
    "create_room.title": "Create New Room",
    "create_room.subtitle": "Create a room and invite your friends to play",
    "create_room.success_title": "Room Created! 🎉",
    "create_room.success_desc": "Share the code with your friends",
    "create_room.room_code": "Room Code",
    "create_room.button_create": "🎮 Create Room",
    "create_room.button_creating": "Creating...",
    "create_room.button_enter": "Enter Room",
    "create_room.label_name": "Your Name",
    "create_room.placeholder_name": "Enter your name",

    // Join Room
    "join_room.title": "Join a Room",
    "join_room.subtitle": "Enter the room code and your name",
    "join_room.placeholder_code": "Room code (e.g. ABC123)",
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
    "game.eliminated": "❌",

    // Voting
    "voting.title": "Round {0} - Voting",
    "voting.desc_reveal": "Voting Results",
    "voting.desc_ask": "Who do you think is the impostor?",
    "voting.most_voted_label": "The most voted was:",
    "voting.result_impostor": "✅ WAS THE IMPOSTOR! You won!",
    "voting.result_innocent": "🚫 Was eliminated! Was not the impostor.",
    "voting.no_votes": "No one was voted as impostor",
    "voting.processing": "Processing votes...",
    "voting.next_round": "Go to Next Round",
    "voting.end_game": "End Game",
    "voting.waiting_host_continue": "Waiting for host to continue...",
    "voting.choose_option": "Choose ONE option:",
    "voting.vote_impostor_label": "🕵️ Vote for who you think is the impostor:",
    "voting.vote_count": "{0} vote{1}",
    "voting.option_next_round": "Next Round",
    "voting.option_end_game": "End Game",
    "voting.button_confirm": "Confirm Vote",
    "voting.button_sending": "Sending...",
    "voting.confirmed": "Vote registered!",
    "voting.waiting_players": "Waiting: {0}",
    "voting.progress": "({0}/{1} votes)",
    "voting.all_voted": "All voted! Processing results...",

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
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, ...args: (string | number)[]) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "en",
      setLanguage: (lang: Language) => set({ language: lang }),
      t: (key: TranslationKey, ...args: (string | number)[]) => {
        const { language } = get();
        let translation: string = translations[language][key] || key;
        args.forEach((arg, index) => {
          translation = translation.replace(`{${index}}`, String(arg));
        });
        return translation;
      },
    }),
    {
      name: "language-storage",
    }
  )
);

// Re-export with the same name for backwards compatibility
export const useLanguage = useLanguageStore;
