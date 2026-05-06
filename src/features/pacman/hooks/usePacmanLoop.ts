import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  createPacmanEngine, Direction, GameStats, Ghost,
  PacmanEngineState, PacmanState, setDirection,
  snapshotStats, tickPacmanEngine,
} from '../engine/pacmanEngine';

export function usePacmanLoop(paused: boolean) {
  const engineRef = useRef<PacmanEngineState>(createPacmanEngine());
  const lastRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(paused);

  const [stats, setStats] = useState<GameStats>(snapshotStats(engineRef.current));
  const [pacman, setPacman] = useState<PacmanState>({ ...engineRef.current.pacman, pos: { ...engineRef.current.pacman.pos } });
  const [ghosts, setGhosts] = useState<Ghost[]>(engineRef.current.ghosts.map(g => ({ ...g, pos: { ...g.pos } })));
  const [dots, setDots] = useState<boolean[][]>(engineRef.current.dots.map(r => [...r]));

  useEffect(() => { pausedRef.current = paused; if (!paused) lastRef.current = null; }, [paused]);

  useEffect(() => {
    const onChange = (s: AppStateStatus) => {
      if (s !== 'active') pausedRef.current = true;
      else { pausedRef.current = paused; lastRef.current = null; }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [paused]);

  useEffect(() => {
    const loop = (now: number) => {
      if (engineRef.current.stats.isOver) { setStats(snapshotStats(engineRef.current)); return; }
      if (pausedRef.current) { lastRef.current = null; rafRef.current = requestAnimationFrame(loop); return; }
      if (lastRef.current == null) { lastRef.current = now; rafRef.current = requestAnimationFrame(loop); return; }
      const dt = Math.min(50, now - lastRef.current); lastRef.current = now;
      tickPacmanEngine(engineRef.current, dt);
      setStats(snapshotStats(engineRef.current));
      setPacman({ ...engineRef.current.pacman, pos: { ...engineRef.current.pacman.pos } });
      setGhosts(engineRef.current.ghosts.map(g => ({ ...g, pos: { ...g.pos } })));
      setDots(engineRef.current.dots.map(r => [...r]));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
  }, []);

  return {
    stats, pacman, ghosts, dots,
    changeDirection: (dir: Direction) => setDirection(engineRef.current, dir),
  };
}
