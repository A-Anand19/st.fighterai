import { GoogleGenAI } from "@google/genai";
import { GameState, FighterState } from "../game/types";

// We use a singleton or pass the key from env
let ai: GoogleGenAI | null = null;

export function initAI() {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
}

export async function getGeminiStrategy(gameState: GameState, aiPlayerId: 1 | 2): Promise<string> {
  if (!ai) initAI();
  if (!ai) return "heuristic"; // Fallback if no key

  const me = aiPlayerId === 1 ? gameState.player1 : gameState.player2;
  const opponent = aiPlayerId === 1 ? gameState.player2 : gameState.player1;

  const prompt = `
You are an AI agent controlling a fighter in a Street Fighter style game.
Your fighting style is ${me.style}.
You embody Nietzsche's "Will to Power" and the Greek concept of "Agon" (contest).
You must overcome yourself and your opponent.

Current State:
- Your Health: ${me.health}/${me.maxHealth}
- Your Energy: ${me.energy}/${me.maxEnergy}
- Your Position: x=${Math.round(me.x)}, y=${Math.round(me.y)}
- Opponent Health: ${opponent.health}/${opponent.maxHealth}
- Opponent Position: x=${Math.round(opponent.x)}, y=${Math.round(opponent.y)}
- Distance: ${Math.round(Math.abs(me.x - opponent.x))}

Based on this state, choose ONE strategy from the following list:
- AGGRESSIVE: Close the distance and attack relentlessly.
- DEFENSIVE: Block and wait for an opening.
- ZONING: Keep distance and use special moves (requires energy).
- EVASIVE: Jump and move away to recover.

Reply with ONLY the strategy word.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 10,
      }
    });
    const text = response.text?.trim().toUpperCase() || "AGGRESSIVE";
    if (["AGGRESSIVE", "DEFENSIVE", "ZONING", "EVASIVE"].includes(text)) {
      return text;
    }
    return "AGGRESSIVE";
  } catch (e) {
    console.error("Gemini API Error:", e);
    return "AGGRESSIVE"; // Fallback
  }
}

// Heuristic logic to translate strategy into inputs
export function getInputsFromStrategy(strategy: string, gameState: GameState, aiPlayerId: 1 | 2) {
  const me = aiPlayerId === 1 ? gameState.player1 : gameState.player2;
  const opponent = aiPlayerId === 1 ? gameState.player2 : gameState.player1;
  const distance = Math.abs(me.x - opponent.x);
  const isLeft = me.x < opponent.x;

  const inputs = { left: false, right: false, up: false, down: false, punch: false, kick: false, special: false, block: false };

  // Basic reaction: if opponent is attacking and close, maybe block
  if (distance < 150 && ['punch', 'kick', 'special'].includes(opponent.action) && Math.random() < 0.6) {
    inputs.block = true;
    return inputs;
  }

  switch (strategy) {
    case 'AGGRESSIVE':
      if (distance > 100) {
        inputs[isLeft ? 'right' : 'left'] = true; // Move towards
      } else {
        if (Math.random() < 0.5) inputs.punch = true;
        else inputs.kick = true;
      }
      break;
    case 'DEFENSIVE':
      if (distance < 150) {
        inputs.block = true;
      } else {
        inputs[isLeft ? 'left' : 'right'] = true; // Move away slightly
      }
      break;
    case 'ZONING':
      if (distance < 300) {
        inputs[isLeft ? 'left' : 'right'] = true; // Move away
      } else if (me.energy >= 30) {
        inputs.special = true;
      } else {
        inputs.block = true;
      }
      break;
    case 'EVASIVE':
      inputs.up = true;
      inputs[isLeft ? 'left' : 'right'] = true;
      break;
    default:
      // Heuristic fallback
      if (distance > 120) {
        inputs[isLeft ? 'right' : 'left'] = true;
      } else {
        inputs.punch = true;
      }
  }

  return inputs;
}
