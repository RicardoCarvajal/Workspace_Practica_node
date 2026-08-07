/**
 * Legacy AWS credentials prompt retired (FR-14).
 * AWS keys come from RuntimeConfigStore after Cognito API config session.
 */
export function isAwsPromptMode(): boolean {
  return false
}
