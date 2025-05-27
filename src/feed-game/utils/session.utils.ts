import { randomBytes } from 'crypto';
import { GameSessionData } from '../interfaces/game-session.interface';

/**
 * @description Utility class for session management and ID generation
 */
export class SessionUtils {
  
  // Generate a short, unique ID for frontend use
  static generateFrontendId(): string {
    return randomBytes(4).toString('hex'); // 8-character hex string
  }


  // Initialize a new game session data structure
  static initializeGameSession(): GameSessionData {
    return {
      commentIdMap: {},
      reverseCommentIdMap: {},
      activeSessionCommentIds: [],
      answeredSessionCommentIds: [],
      gameStartTime: Date.now(),
      questionsShown: 0,
    };
  }

  // Validate if a frontend ID exists in the current session
  static isValidFrontendId(gameData: GameSessionData, frontendId: string): boolean {
    return gameData.activeSessionCommentIds.includes(frontendId);
  }

  // Check if a frontend ID has already been answered
  static isAlreadyAnswered(gameData: GameSessionData, frontendId: string): boolean {
    return gameData.answeredSessionCommentIds.includes(frontendId);
  }

  // Mark a frontend ID as answered
  static markAsAnswered(gameData: GameSessionData, frontendId: string): void {
    if (!gameData.answeredSessionCommentIds.includes(frontendId)) {
      gameData.answeredSessionCommentIds.push(frontendId);
    }
  }

  // Convert frontend ID to real database ID
  static frontendIdToRealId(gameData: GameSessionData, frontendId: string): number | null {
    return gameData.commentIdMap[frontendId] || null;
  }

  // Convert real database ID to frontend ID
  static realIdToFrontendId(gameData: GameSessionData, realId: number): string | null {
    return gameData.reverseCommentIdMap[realId] || null;
  }
}