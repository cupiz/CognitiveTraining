export { CourierMapGame, GAME_KEY, GAME_VERSION } from "./game.js";
export type { CMRenderState } from "./game.js";
export {
  getDifficultyConfig,
  validateConfig,
  generateLayout,
  shortestPath,
  canPass,
  RULE_IDS,
} from "./difficulty.js";
export type {
  CourierMapConfig,
  CourierMapRule,
  CourierMapNode,
  CourierMapEdge,
  CourierMapLayout,
} from "./difficulty.js";