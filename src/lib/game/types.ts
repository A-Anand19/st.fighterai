export type Action = 'idle' | 'walk-forward' | 'walk-backward' | 'jump' | 'crouch' | 'punch' | 'kick' | 'special' | 'block' | 'hit' | 'knockdown';

export interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FighterState {
  id: 1 | 2;
  name: string;
  style: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  action: Action;
  facing: 'left' | 'right';
  isGrounded: boolean;
  velocityX: number;
  velocityY: number;
  width: number;
  height: number;
  actionTimer: number;
  comboCount: number;
}

export interface GameState {
  player1: FighterState;
  player2: FighterState;
  timer: number;
  status: 'menu' | 'playing' | 'gameover';
  winner: 1 | 2 | null;
  particles: Particle[];
  projectiles: Projectile[];
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Projectile {
  id: number;
  ownerId: 1 | 2;
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  active: boolean;
  type: 'hadouken';
}

export type AIType = 'heuristic' | 'inference' | 'learning';
