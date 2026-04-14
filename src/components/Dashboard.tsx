import React from 'react';
import { GameState, AIType } from '../lib/game/types';
import { Activity, Cpu, Zap, Trophy, Settings, Play, Square } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  gameState: GameState;
  aiType: AIType;
  setAiType: (type: AIType) => void;
  onStart: () => void;
  onStop: () => void;
  aiStrategy: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ gameState, aiType, setAiType, onStart, onStop, aiStrategy }) => {
  const p1 = gameState.player1;
  const p2 = gameState.player2;

  const HealthBar = ({ health, maxHealth, reverse }: { health: number, maxHealth: number, reverse?: boolean }) => (
    <div className={`w-full h-5 bg-black/50 border border-glass-border overflow-hidden flex ${reverse ? 'justify-end' : 'justify-start'}`}>
      <motion.div 
        className={`h-full ${reverse ? 'bg-gradient-to-l from-[#00BFFF] to-[#1E90FF] shadow-[0_0_15px_rgba(30,144,255,0.5)]' : 'bg-gradient-to-r from-[#FFD700] to-[#FF4500] shadow-[0_0_15px_rgba(255,69,0,0.5)]'}`}
        initial={{ width: '100%' }}
        animate={{ width: `${(health / maxHealth) * 100}%` }}
        transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
      />
    </div>
  );

  const EnergyBar = ({ energy, maxEnergy, reverse }: { energy: number, maxEnergy: number, reverse?: boolean }) => (
    <div className={`w-2/3 h-2 bg-black/50 border border-glass-border overflow-hidden mt-2 flex ${reverse ? 'justify-end' : 'justify-start'}`}>
      <motion.div 
        className="h-full bg-accent shadow-[0_0_10px_rgba(118,185,0,0.5)]"
        initial={{ width: '0%' }}
        animate={{ width: `${(energy / maxEnergy) * 100}%` }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
      />
    </div>
  );

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* Top HUD */}
      <div className="flex justify-between items-start gap-8 w-full max-w-6xl mx-auto bg-surface backdrop-blur-xl border border-glass-border rounded-xl p-4 mt-4">
        {/* Player 1 Stats */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-accent font-bold text-lg tracking-widest">P1</div>
            <div>
              <h2 className="text-text-main font-bold text-sm tracking-wider uppercase">{p1.name}</h2>
              <p className="text-text-dim text-[10px] font-mono uppercase tracking-widest">{p1.style}</p>
            </div>
          </div>
          <HealthBar health={p1.health} maxHealth={p1.maxHealth} />
          <EnergyBar energy={p1.energy} maxEnergy={p1.maxEnergy} />
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-4xl font-black text-text-main tracking-tighter">
            {gameState.timer}
          </div>
          <div className="text-text-dim text-[10px] font-mono mt-1 uppercase tracking-widest">Time</div>
        </div>

        {/* Player 2 Stats (AI) */}
        <div className="flex-1 flex flex-col items-end">
          <div className="flex items-center gap-3 mb-2 flex-row-reverse">
            <div className="text-[#00BFFF] font-bold text-lg tracking-widest">AI</div>
            <div className="text-right">
              <h2 className="text-text-main font-bold text-sm tracking-wider uppercase">{p2.name}</h2>
              <p className="text-[#00BFFF] text-[10px] font-mono uppercase tracking-widest">MODALITY: {aiType}</p>
            </div>
          </div>
          <HealthBar health={p2.health} maxHealth={p2.maxHealth} reverse />
          <EnergyBar energy={p2.energy} maxEnergy={p2.maxEnergy} reverse />
        </div>
      </div>

      {/* Bottom Control Panel */}
      <div className="pointer-events-auto w-full max-w-6xl mx-auto bg-surface backdrop-blur-xl border border-glass-border rounded-xl p-4 flex gap-6 items-center shadow-2xl mb-4">
        
        {/* Controls Info */}
        <div className="flex-1">
          <h3 className="text-text-dim text-[10px] font-semibold mb-3 uppercase tracking-[1.5px] border-b border-glass-border pb-2">
            Controls
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-text-dim">
            <div><span className="text-text-main bg-white/5 px-1.5 py-0.5 rounded border border-glass-border">W A S D</span> Move/Jump</div>
            <div><span className="text-text-main bg-white/5 px-1.5 py-0.5 rounded border border-glass-border">J</span> Punch</div>
            <div><span className="text-text-main bg-white/5 px-1.5 py-0.5 rounded border border-glass-border">K</span> Kick</div>
            <div><span className="text-text-main bg-white/5 px-1.5 py-0.5 rounded border border-glass-border">L</span> Special</div>
            <div><span className="text-text-main bg-white/5 px-1.5 py-0.5 rounded border border-glass-border">Shift</span> Block</div>
          </div>
        </div>

        {/* AI Training Status */}
        <div className="flex-1 border-l border-glass-border pl-6">
          <h3 className="text-text-dim text-[10px] font-semibold mb-3 uppercase tracking-[1.5px] border-b border-glass-border pb-2">
            AI Training Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-text-dim text-[11px]">Current Strategy</span>
              <span className="text-accent font-mono text-[11px] bg-accent-soft px-2 py-1 rounded border border-accent/30">
                {aiStrategy}
              </span>
            </div>
            <div className="flex gap-2">
              {(['heuristic', 'inference', 'learning'] as AIType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setAiType(type)}
                  className={`flex-1 py-1.5 px-3 rounded text-[11px] font-bold uppercase tracking-wider transition-all border ${
                    aiType === type 
                      ? 'bg-accent text-black border-accent' 
                      : 'bg-white/5 text-text-main border-glass-border hover:bg-white/10'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pl-6 border-l border-glass-border">
          {gameState.status === 'playing' ? (
            <button onClick={onStop} className="w-14 h-14 rounded bg-red-500/10 border border-red-500/50 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors">
              <Square className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button onClick={onStart} className="w-14 h-14 rounded bg-accent-soft border border-accent/50 text-accent flex items-center justify-center hover:bg-accent/30 transition-colors">
              <Play className="w-5 h-5 fill-current" />
            </button>
          )}
        </div>
      </div>

      {/* Game Over Overlay */}
      {gameState.status === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface border border-glass-border p-8 rounded-xl text-center shadow-2xl max-w-md w-full"
          >
            <Trophy className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-4xl font-black text-text-main mb-2">
              {gameState.winner === 1 ? 'YOU WIN' : 'AI WINS'}
            </h2>
            <p className="text-text-dim mb-8">
              {gameState.winner === 1 
                ? "The Will to Power prevails." 
                : "The AI has overcome its limits."}
            </p>
            <button 
              onClick={onStart}
              className="w-full py-4 bg-accent hover:bg-accent/80 text-black rounded font-bold tracking-widest transition-colors"
            >
              REMATCH
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
