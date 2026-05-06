/**
 * ENGINE Pacman — Reescrito para usar coordenadas de imagen.
 * Todas las imágenes son 595×1235 y se apilan como capas.
 * El mapa lógico se define manualmente para coincidir con la imagen.
 */
import { PACMAN_CONFIG } from '../constants/config';
import { GhostColor } from '../constants/sprites';

export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';
export interface FPos { row: number; col: number; }
export type GhostMode = 'scatter' | 'chase' | 'frightened' | 'eaten' | 'house';

export interface Ghost {
  id: GhostColor;
  pos: FPos;
  dir: Direction;
  mode: GhostMode;
  respawnTimer: number;
  exitTimer: number;
}

export interface PacmanState {
  pos: FPos;
  dir: Direction;
  nextDir: Direction;
  mouthOpen: boolean;
  mouthTimer: number;
  invulnerableMs: number;
}

export interface GameStats {
  score: number;
  lives: number;
  remainingMs: number;
  dotsLeft: number;
  totalDots: number;
  isOver: boolean;
  endReason: 'time' | 'lives' | 'win' | null;
  frightened: boolean;
}

export interface PacmanEngineState {
  stats: GameStats;
  pacman: PacmanState;
  ghosts: Ghost[];
  dots: boolean[][];
  frightenedMs: number;
  elapsedMs: number;
}

// ---- MAPA LÓGICO ----
// W=pared, D=dot, P=power, E=vacío, G=ghost house, O=puerta, S=spawn, T=túnel
type C = 'W'|'D'|'P'|'E'|'G'|'O'|'S'|'T';

// 21 cols × 27 rows — coincide con la imagen del laberinto
const MAP: C[][] = [
  // 0
  ['W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W'],
  // 1
  ['W','D','D','D','D','D','D','D','D','D','W','D','D','D','D','D','D','D','D','D','W'],
  // 2
  ['W','D','W','W','W','D','W','W','W','D','W','D','W','W','W','D','W','W','W','D','W'],
  // 3
  ['W','P','W','W','W','D','W','W','W','D','W','D','W','W','W','D','W','W','W','P','W'],
  // 4
  ['W','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','W'],
  // 5
  ['W','D','W','W','W','D','W','D','W','W','W','W','W','D','W','D','W','W','W','D','W'],
  // 6
  ['W','D','D','D','D','D','W','D','D','D','W','D','D','D','W','D','D','D','D','D','W'],
  // 7
  ['W','W','W','W','W','D','W','W','W','E','W','E','W','W','W','D','W','W','W','W','W'],
  // 8
  ['E','E','E','E','W','D','W','E','E','E','E','E','E','E','W','D','W','E','E','E','E'],
  // 9
  ['W','W','W','W','W','D','W','E','W','W','O','W','W','E','W','D','W','W','W','W','W'],
  // 10
  ['T','E','E','E','E','D','E','E','W','G','G','G','W','E','E','D','E','E','E','E','T'],
  // 11
  ['W','W','W','W','W','D','W','E','W','W','W','W','W','E','W','D','W','W','W','W','W'],
  // 12
  ['E','E','E','E','W','D','W','E','E','E','E','E','E','E','W','D','W','E','E','E','E'],
  // 13
  ['W','W','W','W','W','D','W','E','W','W','W','W','W','E','W','D','W','W','W','W','W'],
  // 14
  ['W','D','D','D','D','D','D','D','D','D','W','D','D','D','D','D','D','D','D','D','W'],
  // 15
  ['W','D','W','W','W','D','W','W','W','D','W','D','W','W','W','D','W','W','W','D','W'],
  // 16
  ['W','P','D','D','W','D','D','D','D','D','E','D','D','D','D','D','W','D','D','P','W'],
  // 17
  ['W','W','W','D','W','D','W','D','W','W','W','W','W','D','W','D','W','D','W','W','W'],
  // 18
  ['W','D','D','D','D','D','W','D','D','D','W','D','D','D','W','D','D','D','D','D','W'],
  // 19
  ['W','D','W','W','W','W','W','W','W','D','W','D','W','W','W','W','W','W','W','D','W'],
  // 20
  ['W','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','W'],
  // 21
  ['W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W'],
];

export const ROWS = MAP.length;  // 22
export const COLS = MAP[0].length; // 21

const GHOST_COLORS: GhostColor[] = ['red', 'pink', 'blue', 'orange'];
const EXIT_DELAYS = [0, 3000, 6000, 9000];

const DIR_D: Record<Direction, {dr:number;dc:number}> = {
  up:{dr:-1,dc:0}, down:{dr:1,dc:0}, left:{dr:0,dc:-1}, right:{dr:0,dc:1}, none:{dr:0,dc:0},
};
const OPP: Record<Direction,Direction> = { up:'down',down:'up',left:'right',right:'left',none:'none' };

function canEnter(r:number,c:number): boolean {
  if(c<0||c>=COLS){ if(r>=0&&r<ROWS&&MAP[r]){const c0=MAP[r][0];const cN=MAP[r][COLS-1];if(c0==='T'||cN==='T')return true;} return false; }
  if(r<0||r>=ROWS) return false;
  return MAP[r][c]!=='W';
}
function canDir(r:number,c:number,d:Direction):boolean{ const dd=DIR_D[d]; return canEnter(r+dd.dr,c+dd.dc); }
function dist(a:FPos,b:FPos):number{ return Math.abs(a.row-b.row)+Math.abs(a.col-b.col); }

function countDots():number{ let n=0; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(MAP[r][c]==='D'||MAP[r][c]==='P') n++; return n; }
function findSpawn():{row:number;col:number}{ return {row:16,col:10}; } // celda S/E central fila 16
function findGhostSpawns():{row:number;col:number}[]{ const s:{row:number;col:number}[]=[]; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(MAP[r][c]==='G') s.push({row:r,col:c}); return s; }

// ---- CREAR ----
export function createPacmanEngine(): PacmanEngineState {
  const spawn = findSpawn();
  const gSpawns = findGhostSpawns();
  const totalDots = countDots();
  const dots:boolean[][]=[];
  for(let r=0;r<ROWS;r++){dots[r]=[]; for(let c=0;c<COLS;c++) dots[r][c]=MAP[r][c]==='D'||MAP[r][c]==='P';}

  const ghosts:Ghost[] = GHOST_COLORS.map((color,i)=>{
    const gs=gSpawns[i]||gSpawns[0]||{row:10,col:10};
    return {id:color,pos:{row:gs.row,col:gs.col},dir:'none' as Direction,mode:'house' as GhostMode,respawnTimer:0,exitTimer:EXIT_DELAYS[i]};
  });

  return {
    stats:{score:0,lives:PACMAN_CONFIG.initialLives,remainingMs:PACMAN_CONFIG.durationMs,dotsLeft:totalDots,totalDots,isOver:false,endReason:null,frightened:false},
    pacman:{pos:{row:spawn.row,col:spawn.col},dir:'left',nextDir:'left',mouthOpen:true,mouthTimer:0,invulnerableMs:0},
    ghosts,dots,frightenedMs:0,elapsedMs:0,
  };
}

export function setDirection(state:PacmanEngineState,dir:Direction){state.pacman.nextDir=dir;}

// ---- GHOST AI ----
function ghostTarget(g:Ghost,pac:FPos,pacDir:Direction):FPos{
  switch(g.id){
    case 'red': return pac;
    case 'pink':{const d=DIR_D[pacDir];return{row:Math.max(0,Math.min(ROWS-1,pac.row+d.dr*4)),col:Math.max(0,Math.min(COLS-1,pac.col+d.dc*4))};}
    case 'blue': return {row:ROWS-2,col:COLS-2};
    case 'orange': return dist(g.pos,pac)>6?pac:{row:ROWS-2,col:1};
    default: return pac;
  }
}
function scatterTarget(g:Ghost):FPos{
  switch(g.id){case 'red':return{row:0,col:COLS-2};case 'pink':return{row:0,col:1};case 'blue':return{row:ROWS-1,col:COLS-2};case 'orange':return{row:ROWS-1,col:1};default:return{row:0,col:0};}
}
function chooseDir(pos:FPos,cur:Direction,target:FPos):Direction{
  const r=Math.round(pos.row);const c=Math.round(pos.col);
  const dirs:Direction[]=['up','down','left','right'];
  const opp=OPP[cur];
  const avail=dirs.filter(d=>d!==opp&&canDir(r,c,d));
  if(!avail.length)return canDir(r,c,opp)?opp:'none';
  if(avail.length===1)return avail[0];
  let best=avail[0];let bestD=Infinity;
  for(const d of avail){const dd=DIR_D[d];const nr=r+dd.dr;const nc=c+dd.dc;const distance=Math.abs(nr-target.row)+Math.abs(nc-target.col);if(distance<bestD){bestD=distance;best=d;}}
  return best;
}
function randDir(pos:FPos,cur:Direction):Direction{
  const r=Math.round(pos.row);const c=Math.round(pos.col);
  const dirs:Direction[]=['up','down','left','right'];
  const avail=dirs.filter(d=>d!==OPP[cur]&&canDir(r,c,d));
  if(!avail.length)return canDir(r,c,OPP[cur])?OPP[cur]:'none';
  return avail[Math.floor(Math.random()*avail.length)];
}

const GHOST_EXIT:FPos={row:8,col:10};
const SNAP=PACMAN_CONFIG.snapThreshold;

function moveFloat(pos:FPos,dir:Direction,speed:number,dt:number):FPos{
  if(dir==='none')return{...pos};
  const d=DIR_D[dir];
  let nr=pos.row+d.dr*speed*dt;let nc=pos.col+d.dc*speed*dt;
  if(nc<-0.5)nc=COLS-0.5; else if(nc>=COLS)nc=-0.4;
  return{row:nr,col:nc};
}
function atCenter(pos:FPos):boolean{return Math.abs(pos.row-Math.round(pos.row))<SNAP&&Math.abs(pos.col-Math.round(pos.col))<SNAP;}
function snap(pos:FPos):FPos{return{row:Math.round(pos.row),col:Math.round(pos.col)};}

// ---- TICK ----
export function tickPacmanEngine(state:PacmanEngineState,dtMs:number):PacmanEngineState{
  if(state.stats.isOver)return state;
  const dt=dtMs/1000;

  state.elapsedMs+=dtMs;
  state.stats.remainingMs=Math.max(0,PACMAN_CONFIG.durationMs-state.elapsedMs);
  if(state.stats.remainingMs<=0){state.stats.isOver=true;state.stats.endReason='time';return state;}

  if(state.frightenedMs>0){state.frightenedMs=Math.max(0,state.frightenedMs-dtMs);state.stats.frightened=state.frightenedMs>0;if(state.frightenedMs<=0)for(const g of state.ghosts)if(g.mode==='frightened')g.mode='chase';}
  if(state.pacman.invulnerableMs>0)state.pacman.invulnerableMs=Math.max(0,state.pacman.invulnerableMs-dtMs);

  state.pacman.mouthTimer+=dtMs;
  if(state.pacman.mouthTimer>=PACMAN_CONFIG.mouthAnimMs){state.pacman.mouthTimer=0;state.pacman.mouthOpen=!state.pacman.mouthOpen;}

  // Mover Pacman
  const pac=state.pacman;
  if(atCenter(pac.pos)){
    pac.pos=snap(pac.pos);
    const r=pac.pos.row;const c=pac.pos.col;
    if(pac.nextDir!=='none'&&canDir(r,c,pac.nextDir))pac.dir=pac.nextDir;
    if(!canDir(r,c,pac.dir))pac.dir='none';
    // Recoger dot
    const wc=c<0?COLS-1:c>=COLS?0:c;
    if(r>=0&&r<ROWS&&wc>=0&&wc<COLS&&state.dots[r][wc]){
      state.dots[r][wc]=false;
      const cell=MAP[r][wc];
      if(cell==='P'){
        state.stats.score=Math.min(state.stats.score+PACMAN_CONFIG.pointsPerPowerDot,PACMAN_CONFIG.maxScore);
        state.frightenedMs=PACMAN_CONFIG.frightenedDurationMs;state.stats.frightened=true;
        for(const g of state.ghosts)if(g.mode==='chase'||g.mode==='scatter'){g.mode='frightened';g.dir=OPP[g.dir];}
      } else {
        state.stats.score=Math.min(state.stats.score+PACMAN_CONFIG.pointsPerDot,PACMAN_CONFIG.maxScore);
      }
      state.stats.dotsLeft--;
      if(state.stats.dotsLeft<=0){state.stats.isOver=true;state.stats.endReason='win';return state;}
    }
  }
  if(pac.dir!=='none'){
    const np=moveFloat(pac.pos,pac.dir,PACMAN_CONFIG.pacmanSpeed,dt);
    const nr=Math.round(np.row);const nc=Math.round(np.col);
    const cr=Math.round(pac.pos.row);const cc=Math.round(pac.pos.col);
    if(nr!==cr||nc!==cc){const wc=nc<0?COLS-1:nc>=COLS?0:nc;if(canEnter(nr,wc))pac.pos=np;else{pac.pos=snap(pac.pos);pac.dir='none';}}
    else pac.pos=np;
  }

  // Mover fantasmas
  for(const g of state.ghosts){
    if(g.mode==='eaten'){g.respawnTimer-=dtMs;if(g.respawnTimer<=0){const sp=findGhostSpawns();const i=GHOST_COLORS.indexOf(g.id);const s=sp[i]||sp[0]||{row:10,col:10};g.pos={...s};g.mode='house';g.exitTimer=2000;g.dir='none';}continue;}
    if(g.mode==='house'){g.exitTimer-=dtMs;if(g.exitTimer<=0){if(g.pos.row>GHOST_EXIT.row){g.pos.row-=PACMAN_CONFIG.ghostSpeed*dt;if(g.pos.row<=GHOST_EXIT.row)g.pos.row=GHOST_EXIT.row;}else if(Math.abs(g.pos.col-GHOST_EXIT.col)>0.3){g.pos.col+=(g.pos.col<GHOST_EXIT.col?1:-1)*PACMAN_CONFIG.ghostSpeed*dt;}else{g.pos={...GHOST_EXIT};g.mode='chase';g.dir='left';}}continue;}

    const isFr=g.mode==='frightened';const spd=isFr?PACMAN_CONFIG.frightenedGhostSpeed:PACMAN_CONFIG.ghostSpeed;
    if(atCenter(g.pos)){g.pos=snap(g.pos);if(isFr)g.dir=randDir(g.pos,g.dir);else{const cy=state.elapsedMs%27000;const t=cy<7000?scatterTarget(g):ghostTarget(g,pac.pos,pac.dir);g.dir=chooseDir(g.pos,g.dir,t);}}
    if(g.dir!=='none'){const np=moveFloat(g.pos,g.dir,spd,dt);const nr=Math.round(np.row);const nc=Math.round(np.col);const cr=Math.round(g.pos.row);const cc=Math.round(g.pos.col);if(nr!==cr||nc!==cc){const wc=nc<0?COLS-1:nc>=COLS?0:nc;if(canEnter(nr,wc))g.pos=np;else g.pos=snap(g.pos);}else g.pos=np;}
  }

  // Colisiones
  for(const g of state.ghosts){
    if(g.mode==='eaten'||g.mode==='house')continue;
    if(dist(g.pos,pac.pos)<0.7){
      if(g.mode==='frightened'){state.stats.score=Math.min(state.stats.score+PACMAN_CONFIG.pointsPerGhost,PACMAN_CONFIG.maxScore);g.mode='eaten';g.respawnTimer=PACMAN_CONFIG.ghostRespawnMs;}
      else if(pac.invulnerableMs<=0){state.stats.lives--;if(state.stats.lives<=0){state.stats.lives=0;state.stats.isOver=true;state.stats.endReason='lives';return state;}const sp=findSpawn();pac.pos={...sp};pac.dir='left';pac.nextDir='left';pac.invulnerableMs=PACMAN_CONFIG.respawnInvulnerableMs;}
    }
  }
  return state;
}

export function snapshotStats(s:PacmanEngineState):GameStats{return{...s.stats};}
export function getMap():C[][]{return MAP;}
