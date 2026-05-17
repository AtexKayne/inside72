export const PRIVACY_POLICY_PATH = "/privacy";

export function hasPersonalDataConsent(value) {
  return value === true || value === "true" || value === 1;
}
