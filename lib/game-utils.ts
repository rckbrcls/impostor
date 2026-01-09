// Gera código de sala de 6 caracteres
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Sem I, O, 0, 1 para evitar confusão
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Gera ou recupera ID único do client (armazenado no localStorage)
export function getClientId(): string {
  if (typeof window === "undefined") return "";

  let clientId = localStorage.getItem("impostor_client_id");
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem("impostor_client_id", clientId);
  }
  return clientId;
}

// Sorteia um impostor aleatório entre os jogadores
export function pickRandomImpostor(playerIds: string[]): string {
  return playerIds[Math.floor(Math.random() * playerIds.length)];
}
