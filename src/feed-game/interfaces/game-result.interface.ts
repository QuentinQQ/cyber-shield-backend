/**
 * LEGACY
 * @description Represents a single comment response submitted by a player (legacy version).
 */
export interface LegacySubmissionItem {
  comment_id: number;
  response_status: 'like' | 'dislike';
  response_time: number; // in milliseconds
}


/**
 * NEW
 * @description Represents a single comment response submitted by a player (new version).
 */
export interface SubmissionItem {
  comment_id: string;
  response_status: 'like' | 'dislike';
  response_time: number;
}

/**
 * NEW
 * @description Internal submission item with real database IDs
 */
export interface InternalSubmissionItem {
  comment_id: number; // Real database ID
  response_status: 'like' | 'dislike';
  response_time: number;
}


/**
 * LEGACY
 * @description Request payload sent to the remote result API (legacy version).
 */
export interface GameResultRequest {
  submission: InternalSubmissionItem[];
}

/**
 * NEW
 * @description Frontend request payload with obfuscated IDs
 */
export interface FrontendGameResultRequest {
  submission: SubmissionItem[]; // NEW: 使用混淆ID的提交项
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