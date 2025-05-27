/**
 * @description Game session data structure stored in Redis
 */
export interface GameSessionData {
  commentIdMap: Record<string, number>;
  reverseCommentIdMap: Record<number, string>;
  activeSessionCommentIds: string[];
  answeredSessionCommentIds: string[];
  gameStartTime: number;
  questionsShown: number;
}

/**
 * @description Extended Express Session interface
 */
declare module 'express-session' {
  interface SessionData {
    gameData?: GameSessionData;
  }
}