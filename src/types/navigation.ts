export type RootStackParamList = {
  Register: undefined;
  Login: undefined;
  Home: undefined;
  ScanQR: undefined;
  Mision: undefined;
  Logros: undefined;
  Ranking: undefined;
  Mapa: undefined;
  Progreso: undefined;
  Configuracion: undefined;
  EditarPerfil: undefined;
  // ---- Minijuego Food Drop (Tienda de la Confianza) ----
  FoodDropGame: undefined;
  FoodDropResult: { score: number; endReason: 'time' | 'lives' };
  FoodDropAlreadyPlayed: undefined;
  // ---- Minijuego Pacman (Recorrido Campus) ----
  PacmanGame: undefined;
  PacmanResult: { score: number; endReason: 'time' | 'lives' | 'win' };
  PacmanAlreadyPlayed: undefined;
};