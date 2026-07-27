/**
 * Standardized OAuth 2.0 Error Responses (RFC 6749 Section 5.2)
 * 
 * All OAuth endpoints should return errors in this format:
 * {
 *   "error": "error_code",
 *   "error_description": "Human-readable description",
 *   "error_uri": "https://tools.ietf.org/html/rfc6749#section-5.2"
 * }
 */

export type OAuthErrorCode =
  | "invalid_request"
  | "unauthorized_client"
  | "access_denied"
  | "unsupported_response_type"
  | "invalid_scope"
  | "server_error"
  | "temporarily_unavailable"
  | "invalid_grant"
  | "invalid_client"
  | "unsupported_grant_type"
  | "invalid_token"
  | "slow_down";

export interface OAuthErrorResponse {
  error: OAuthErrorCode;
  error_description: string;
  error_uri?: string;
}

const ERROR_URI = "https://tools.ietf.org/html/rfc6749#section-5.2";

/**
 * Create a standardized OAuth error response
 */
export function oauthError(
  error: OAuthErrorCode,
  description: string
): OAuthErrorResponse {
  return {
    error,
    error_description: description,
    error_uri: ERROR_URI,
  };
}

/**
 * Pre-defined OAuth error responses
 */
export const OAuthErrors = {
  invalidRequest: (detail?: string) =>
    oauthError("invalid_request", detail || "The request is missing a required parameter, includes an invalid parameter value, or is otherwise malformed."),

  invalidClient: (detail?: string) =>
    oauthError("invalid_client", detail || "Client authentication failed."),

  invalidGrant: (detail?: string) =>
    oauthError("invalid_grant", detail || "The authorization grant or refresh token is invalid, expired, or revoked."),

  unauthorizedClient: (detail?: string) =>
    oauthError("unauthorized_client", detail || "The client is not authorized to request an authorization code using this method."),

  unsupportedResponseType: (detail?: string) =>
    oauthError("unsupported_response_type", detail || "The authorization server does not support obtaining an authorization code using this method."),

  invalidScope: (detail?: string) =>
    oauthError("invalid_scope", detail || "The requested scope is invalid, unknown, or malformed."),

  serverError: (detail?: string) =>
    oauthError("server_error", detail || "The authorization server encountered an unexpected condition that prevented it from fulfilling the request."),

  temporarilyUnavailable: (detail?: string) =>
    oauthError("temporarily_unavailable", detail || "The authorization server is currently unable to handle the request due to a temporary overloading or maintenance of the server."),

  accessDenied: (detail?: string) =>
    oauthError("access_denied", detail || "The resource owner or authorization server denied the request."),

  unsupportedGrantType: (detail?: string) =>
    oauthError("unsupported_grant_type", detail || "The authorization grant type is not supported by the authorization server."),

  invalidToken: (detail?: string) =>
    oauthError("invalid_token", detail || "The access token provided is expired, revoked, malformed, or invalid for other reasons."),

  slowDown: (detail?: string) =>
    oauthError("slow_down", detail || "Too many requests. Please slow down your request rate."),
};
