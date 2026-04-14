import React, { useEffect, useRef } from 'react';
import { GameState } from '../lib/game/types';
import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y } from '../lib/game/Constants';

interface GameCanvasProps {
  gameState: GameState;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#000000'; // black
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw grid
    ctx.strokeStyle = 'rgba(118, 185, 0, 0.05)';
    ctx.lineWidth = 1;
    for(let i=0; i<GAME_WIDTH; i+=40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, GAME_HEIGHT); ctx.stroke();
    }
    for(let i=0; i<GAME_HEIGHT; i+=40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(GAME_WIDTH, i); ctx.stroke();
    }

    // Draw Ground
    ctx.fillStyle = 'rgba(118, 185, 0, 0.02)';
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
    ctx.strokeStyle = 'rgba(118, 185, 0, 0.3)';
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(GAME_WIDTH, GROUND_Y); ctx.stroke();

    // Draw Fighters
    const drawFighter = (f: typeof gameState.player1, isP1: boolean) => {
      ctx.save();
      ctx.translate(f.x + f.width/2, f.y + f.height/2);
      if (f.facing === 'left') ctx.scale(-1, 1);
      
      // Body
      const baseColor = isP1 ? 'rgba(118, 185, 0, 0.2)' : 'rgba(0, 191, 255, 0.2)';
      const borderColor = isP1 ? '#76B900' : '#00BFFF';
      
      if (f.action === 'hit' || f.action === 'knockdown') {
        ctx.fillStyle = 'rgba(255, 69, 0, 0.5)';
        ctx.strokeStyle = '#FF4500';
      } else {
        // Gradient
        const grad = ctx.createLinearGradient(0, -f.height/2, 0, f.height/2);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, baseColor);
        ctx.fillStyle = grad;
        ctx.strokeStyle = borderColor;
      }
      
      ctx.lineWidth = 2;

      if (f.action === 'crouch') {
        ctx.fillRect(-f.width/2, 0, f.width, f.height/2);
        ctx.strokeRect(-f.width/2, 0, f.width, f.height/2);
      } else {
        ctx.fillRect(-f.width/2, -f.height/2, f.width, f.height);
        ctx.strokeRect(-f.width/2, -f.height/2, f.width, f.height);
      }

      // Action indicators (simple visuals)
      if (f.action === 'punch') {
        ctx.fillStyle = borderColor;
        ctx.fillRect(f.width/2, -20, 40, 20);
      } else if (f.action === 'kick') {
        ctx.fillStyle = borderColor;
        ctx.fillRect(f.width/2, 20, 60, 20);
      } else if (f.action === 'block') {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, f.width, -Math.PI/2, Math.PI/2);
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = borderColor;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isP1 ? 'PLAYER_01' : 'AI_AGENT', 0, f.height/2 - 10);

      ctx.restore();
    };

    drawFighter(gameState.player1, true);
    drawFighter(gameState.player2, false);

    // Draw Projectiles
    for (const p of gameState.projectiles) {
      const color = p.ownerId === 1 ? '#76B900' : '#00BFFF';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw Particles
    for (const p of gameState.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw Frame Buffer Text
    ctx.fillStyle = '#76B900';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('FRAME_BUFFER: 60FPS [REALTIME_SYNC]', 20, GAME_HEIGHT - 20);

  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="w-full h-full object-contain rounded-xl shadow-2xl border border-glass-border"
    />
  );
};
