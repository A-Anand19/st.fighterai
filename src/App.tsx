import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './lib/game/Engine';
import { GameState, AIType } from './lib/game/types';
import { GameCanvas } from './components/GameCanvas';
import { Dashboard } from './components/Dashboard';
import { getGeminiStrategy, getInputsFromStrategy } from './lib/ai/GeminiAgent';

export default function App() {
  const engineRef = useRef<GameEngine>(new GameEngine());
  const [gameState, setGameState] = useState<GameState>(engineRef.current.state);
  const [aiType, setAiType] = useState<AIType>('inference');
  const [aiStrategy, setAiStrategy] = useState<string>('ANALYZING...');
  const requestRef = useRef<number>();
  const lastAiUpdate = useRef<number>(0);

  // Input state
  const keys = useRef({
    w: false, a: false, s: false, d: false,
    j: false, k: false, l: false, shift: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) keys.current[key as keyof typeof keys.current] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) keys.current[key as keyof typeof keys.current] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = () => {
    engineRef.current.start();
    setGameState({ ...engineRef.current.state });
  };

  const stopGame = () => {
    engineRef.current.state.status = 'menu';
    setGameState({ ...engineRef.current.state });
  };

  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (engineRef.current.state.status === 'playing' && engineRef.current.state.timer > 0) {
        engineRef.current.state.timer--;
        if (engineRef.current.state.timer === 0) {
          engineRef.current.state.status = 'gameover';
          engineRef.current.state.winner = engineRef.current.state.player1.health > engineRef.current.state.player2.health ? 1 : 2;
        }
        setGameState({ ...engineRef.current.state });
      }
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    const update = async (time: number) => {
      const engine = engineRef.current;
      
      if (engine.state.status === 'playing') {
        // Player 1 Input
        engine.handleInput(1, {
          up: keys.current.w,
          down: keys.current.s,
          left: keys.current.a,
          right: keys.current.d,
          punch: keys.current.j,
          kick: keys.current.k,
          special: keys.current.l,
          block: keys.current.shift,
        });

        // AI Input
        if (aiType === 'inference' || aiType === 'learning') {
          // Update strategy every 2 seconds
          if (time - lastAiUpdate.current > 2000) {
            lastAiUpdate.current = time;
            getGeminiStrategy(engine.state, 2).then(strategy => {
              setAiStrategy(strategy);
            });
          }
        } else {
          setAiStrategy('HEURISTIC');
        }

        const aiInputs = getInputsFromStrategy(aiStrategy, engine.state, 2);
        engine.handleInput(2, aiInputs);

        engine.update();
        setGameState({ ...engine.state });
      }

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [aiType, aiStrategy]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-3 font-sans overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 50%, #111 0%, #050505 100%)' }}>
      <div className="relative w-full max-w-[1280px] aspect-video bg-black border border-glass-border rounded-xl overflow-hidden shadow-[0_0_50px_rgba(118,185,0,0.1)]">
        <GameCanvas gameState={gameState} />
        <Dashboard 
          gameState={gameState} 
          aiType={aiType} 
          setAiType={setAiType}
          onStart={startGame}
          onStop={stopGame}
          aiStrategy={aiStrategy}
        />
      </div>
    </div>
  );
}
