/**
 * @description Single raw comment structure returned from external comment API.
 */
export interface RawComment {
  comment_id: number;
  comment_text: string;
  comment_fake_name: string;
}

/**
 * @description Structure of the full response returned by the external API.
 */
export interface RawApiResponse {
  Comments: RawComment[];
}

/**
 * @description Frontend-safe comment structure with mapped IDs
 */
export interface FrontendComment {
  comment_id: string;
  comment_text: string;
  comment_fake_name: string;
}

/**
 * @description Response structure for frontend comment requests
 */
export interface FrontendCommentResponse {
  comments: FrontendComment[];
  session_id: string;
  total_questions: number;
}