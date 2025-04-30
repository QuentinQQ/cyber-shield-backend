/**
 * @description Represents a single comment response submitted by a player.
 */
export interface SubmissionItem {
  comment_id: number;
  response_status: 'like' | 'dislike';
  response_time: number; // in milliseconds
}

/**
 * @description Request payload sent to the remote result API.
 */
export interface GameResultRequest {
  submission: SubmissionItem[];
}

/**
 * @description Response structure returned by the remote result API.
 */
export interface GameResultResponse {
  score: number;
  answered: number;
  answered_cor: number;
  percent: string;
  submission_id: number;
  comparison: string;
}

/**
 * @description Enhanced response structure returned by the V2 remote result API.
 */
export interface GameResultResponseV2 {
  mistakes: [string, string][]; // [comment text, comment type]
  problem: string;
  summary: string;
  score: number;
  answered: number;
  answered_cor: number;
  percent: string;
  submission_id: number;
  comparison: string;
}