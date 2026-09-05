export { RedLightGame, GAME_KEY, GAME_VERSION } from "./game.js";
export type { RLRenderState, RLPhase } from "./game.js";
export {
  getDifficultyConfig,
  validateConfig,
  isStopTrial,
  calculateSsd,
  adaptSsd,
  STOP_WINDOW_MS,
} from "./difficulty.js";
export type { RedLightConfig } from "./difficulty.js";