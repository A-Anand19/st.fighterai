import { GameState, FighterState, Action, Particle, Projectile } from './types';
import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y, GRAVITY, MAX_HEALTH, MAX_ENERGY, FIGHTER_WIDTH, FIGHTER_HEIGHT, MOVEMENT_SPEED, JUMP_FORCE, ACTION_DURATIONS, DAMAGE, ENERGY_COST, ENERGY_GAIN } from './Constants';

export class GameEngine {
  public state: GameState;
  private particleIdCounter = 0;
  private projectileIdCounter = 0;
  public onHit?: (x: number, y: number, damage: number) => void;
  public onGameOver?: (winner: 1 | 2) => void;

  constructor() {
    this.state = this.getInitialState();
  }

  public getInitialState(): GameState {
    return {
      player1: {
        id: 1,
        name: 'Ryu',
        style: 'Ansatsuken',
        x: 300,
        y: GROUND_Y - FIGHTER_HEIGHT,
        health: MAX_HEALTH,
        maxHealth: MAX_HEALTH,
        energy: 0,
        maxEnergy: MAX_ENERGY,
        action: 'idle',
        facing: 'right',
        isGrounded: true,
        velocityX: 0,
        velocityY: 0,
        width: FIGHTER_WIDTH,
        height: FIGHTER_HEIGHT,
        actionTimer: 0,
        comboCount: 0,
      },
      player2: {
        id: 2,
        name: 'Baki',
        style: 'MMA',
        x: GAME_WIDTH - 300 - FIGHTER_WIDTH,
        y: GROUND_Y - FIGHTER_HEIGHT,
        health: MAX_HEALTH,
        maxHealth: MAX_HEALTH,
        energy: 0,
        maxEnergy: MAX_ENERGY,
        action: 'idle',
        facing: 'left',
        isGrounded: true,
        velocityX: 0,
        velocityY: 0,
        width: FIGHTER_WIDTH,
        height: FIGHTER_HEIGHT,
        actionTimer: 0,
        comboCount: 0,
      },
      timer: 99,
      status: 'menu',
      winner: null,
      particles: [],
      projectiles: [],
    };
  }

  public start() {
    this.state = this.getInitialState();
    this.state.status = 'playing';
  }

  public update() {
    if (this.state.status !== 'playing') return;

    this.updateFighter(this.state.player1, this.state.player2);
    this.updateFighter(this.state.player2, this.state.player1);
    this.updateProjectiles();
    this.updateParticles();
    this.checkCollisions();
    this.updateFacing();

    // Timer logic could go here, but usually handled by a separate 1-second interval
    if (this.state.player1.health <= 0 || this.state.player2.health <= 0) {
      this.state.status = 'gameover';
      this.state.winner = this.state.player1.health <= 0 ? 2 : 1;
      if (this.onGameOver) this.onGameOver(this.state.winner);
    }
  }

  private updateFighter(fighter: FighterState, opponent: FighterState) {
    // Apply gravity
    if (!fighter.isGrounded) {
      fighter.velocityY += GRAVITY;
    }

    fighter.x += fighter.velocityX;
    fighter.y += fighter.velocityY;

    // Ground collision
    if (fighter.y >= GROUND_Y - fighter.height) {
      fighter.y = GROUND_Y - fighter.height;
      fighter.velocityY = 0;
      fighter.isGrounded = true;
      if (fighter.action === 'jump') {
        this.setAction(fighter, 'idle');
      }
    } else {
      fighter.isGrounded = false;
    }

    // Wall collision
    if (fighter.x < 0) fighter.x = 0;
    if (fighter.x > GAME_WIDTH - fighter.width) fighter.x = GAME_WIDTH - fighter.width;

    // Action timers
    if (fighter.actionTimer > 0) {
      fighter.actionTimer--;
      if (fighter.actionTimer === 0) {
        if (fighter.action === 'knockdown') {
          // Stay down or get up
          this.setAction(fighter, 'idle');
        } else {
          this.setAction(fighter, 'idle');
        }
      }
    }

    // Friction
    if (fighter.action === 'idle' || fighter.action === 'crouch' || fighter.action === 'block') {
      fighter.velocityX *= 0.8;
      if (Math.abs(fighter.velocityX) < 0.5) fighter.velocityX = 0;
    }
  }

  private updateFacing() {
    const p1 = this.state.player1;
    const p2 = this.state.player2;
    
    // Only update facing if both are idle or walking
    const canTurn = (f: FighterState) => ['idle', 'walk-forward', 'walk-backward', 'crouch'].includes(f.action);

    if (canTurn(p1) && canTurn(p2)) {
      if (p1.x < p2.x) {
        p1.facing = 'right';
        p2.facing = 'left';
      } else {
        p1.facing = 'left';
        p2.facing = 'right';
      }
    }
  }

  public handleInput(playerId: 1 | 2, input: { left: boolean, right: boolean, up: boolean, down: boolean, punch: boolean, kick: boolean, special: boolean, block: boolean }) {
    if (this.state.status !== 'playing') return;

    const fighter = playerId === 1 ? this.state.player1 : this.state.player2;
    if (['hit', 'knockdown', 'punch', 'kick', 'special'].includes(fighter.action)) return;

    if (input.punch) {
      this.setAction(fighter, 'punch');
      return;
    }
    if (input.kick) {
      this.setAction(fighter, 'kick');
      return;
    }
    if (input.special && fighter.energy >= ENERGY_COST.special) {
      this.setAction(fighter, 'special');
      fighter.energy -= ENERGY_COST.special;
      this.spawnProjectile(fighter);
      return;
    }

    if (input.block) {
      this.setAction(fighter, 'block');
      return;
    }

    if (input.up && fighter.isGrounded) {
      fighter.velocityY = JUMP_FORCE;
      fighter.isGrounded = false;
      this.setAction(fighter, 'jump');
    } else if (input.down) {
      this.setAction(fighter, 'crouch');
    } else if (input.left) {
      fighter.velocityX = -MOVEMENT_SPEED;
      this.setAction(fighter, fighter.facing === 'left' ? 'walk-forward' : 'walk-backward');
    } else if (input.right) {
      fighter.velocityX = MOVEMENT_SPEED;
      this.setAction(fighter, fighter.facing === 'right' ? 'walk-forward' : 'walk-backward');
    } else if (fighter.isGrounded) {
      this.setAction(fighter, 'idle');
    }
  }

  private setAction(fighter: FighterState, action: Action) {
    if (fighter.action === action) return;
    fighter.action = action;
    fighter.actionTimer = ACTION_DURATIONS[action as keyof typeof ACTION_DURATIONS] || 0;
  }

  private spawnProjectile(fighter: FighterState) {
    this.state.projectiles.push({
      id: this.projectileIdCounter++,
      ownerId: fighter.id,
      x: fighter.facing === 'right' ? fighter.x + fighter.width : fighter.x - 40,
      y: fighter.y + fighter.height / 3,
      vx: fighter.facing === 'right' ? 15 : -15,
      width: 40,
      height: 40,
      active: true,
      type: 'hadouken'
    });
  }

  private updateProjectiles() {
    for (const p of this.state.projectiles) {
      if (!p.active) continue;
      p.x += p.vx;
      if (p.x < -100 || p.x > GAME_WIDTH + 100) {
        p.active = false;
      }
    }
    this.state.projectiles = this.state.projectiles.filter(p => p.active);
  }

  private checkCollisions() {
    const p1 = this.state.player1;
    const p2 = this.state.player2;

    // Melee attacks
    this.checkMeleeHit(p1, p2);
    this.checkMeleeHit(p2, p1);

    // Projectiles
    for (const proj of this.state.projectiles) {
      if (!proj.active) continue;
      const target = proj.ownerId === 1 ? p2 : p1;
      if (this.isOverlapping(proj, target)) {
        proj.active = false;
        this.applyDamage(target, DAMAGE.special, proj.ownerId === 1 ? p1 : p2, true);
        this.spawnHitParticles(proj.x + proj.width/2, proj.y + proj.height/2, 20, '#00ffff');
      }
    }
  }

  private checkMeleeHit(attacker: FighterState, defender: FighterState) {
    if (['punch', 'kick'].includes(attacker.action) && attacker.actionTimer === Math.floor(ACTION_DURATIONS[attacker.action as 'punch'|'kick'] / 2)) {
      // Create an attack hitbox
      const reach = attacker.action === 'kick' ? 60 : 40;
      const hitbox = {
        x: attacker.facing === 'right' ? attacker.x + attacker.width : attacker.x - reach,
        y: attacker.y + 20,
        width: reach,
        height: 60
      };

      if (this.isOverlapping(hitbox, defender)) {
        const dmg = attacker.action === 'punch' ? DAMAGE.punch : DAMAGE.kick;
        this.applyDamage(defender, dmg, attacker, false);
        this.spawnHitParticles(hitbox.x + hitbox.width/2, hitbox.y + hitbox.height/2, 10, '#ffaa00');
      }
    }
  }

  private isOverlapping(rect1: {x: number, y: number, width: number, height: number}, rect2: {x: number, y: number, width: number, height: number}) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  private applyDamage(defender: FighterState, amount: number, attacker: FighterState, isHeavy: boolean) {
    if (defender.action === 'block') {
      amount = Math.floor(amount * 0.2); // Chip damage
      defender.energy = Math.min(MAX_ENERGY, defender.energy + ENERGY_GAIN.takeHit);
      defender.velocityX = attacker.facing === 'right' ? 5 : -5; // Pushback
    } else {
      this.setAction(defender, isHeavy ? 'knockdown' : 'hit');
      defender.health = Math.max(0, defender.health - amount);
      defender.energy = Math.min(MAX_ENERGY, defender.energy + ENERGY_GAIN.takeHit);
      attacker.energy = Math.min(MAX_ENERGY, attacker.energy + ENERGY_GAIN.hit);
      attacker.comboCount++;
      defender.velocityX = attacker.facing === 'right' ? 10 : -10;
      if (isHeavy) defender.velocityY = -10;
      
      if (this.onHit) this.onHit(defender.x + defender.width/2, defender.y + defender.height/2, amount);
    }
  }

  private spawnHitParticles(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      this.state.particles.push({
        id: this.particleIdCounter++,
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 20 + Math.random() * 20,
        maxLife: 40,
        color,
        size: 3 + Math.random() * 5
      });
    }
  }

  private updateParticles() {
    for (const p of this.state.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    }
    this.state.particles = this.state.particles.filter(p => p.life > 0);
  }
}
