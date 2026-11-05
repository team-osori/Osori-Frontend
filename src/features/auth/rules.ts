/** 백엔드 SignupRequest · LoginRequest 규칙과 같게 맞춘 입력 검사 */

export const LOGIN_ID_RULE = '4~30자 · 영문으로 시작 · 영문, 숫자, _ 사용'
export const PASSWORD_RULE = '12자 이상'

const LOGIN_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/

export function isValidLoginId(loginId: string) {
  return loginId.length >= 4 && loginId.length <= 30 && LOGIN_ID_PATTERN.test(loginId)
}

export function isValidPassword(password: string) {
  return password.length >= 12 && password.length <= 128
}

export function isValidName(name: string) {
  const trimmed = name.trim()
  return trimmed.length >= 1 && trimmed.length <= 30
}
