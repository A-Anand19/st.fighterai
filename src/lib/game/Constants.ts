export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GROUND_Y = 600;
export const GRAVITY = 0.8;
export const MAX_HEALTH = 1000;
export const MAX_ENERGY = 100;

export const FIGHTER_WIDTH = 100;
export const FIGHTER_HEIGHT = 200;

export const MOVEMENT_SPEED = 6;
export const JUMP_FORCE = -18;

export const ACTION_DURATIONS = {
  punch: 15,
  kick: 20,
  special: 30,
  hit: 20,
  knockdown: 60,
  block: 10,
};

export const DAMAGE = {
  punch: 40,
  kick: 60,
  special: 120,
};

export const ENERGY_COST = {
  special: 30,
};

export const ENERGY_GAIN = {
  hit: 10,
  takeHit: 5,
};
