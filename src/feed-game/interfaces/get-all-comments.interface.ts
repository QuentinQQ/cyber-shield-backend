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
