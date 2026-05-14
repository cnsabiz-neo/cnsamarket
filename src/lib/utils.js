const numberFormatter = new Intl.NumberFormat('ko-KR');

/**
 * 숫자를 한국 로케일 천 단위 구분 문자열로 변환.
 * 숫자와 문자열(숫자 외 문자 제거 후 파싱) 모두 허용.
 */
export function formatNumber(value) {
  const n = typeof value === 'string'
    ? parseInt(value.replace(/\D/g, ''), 10)
    : (value ?? 0);
  return Number.isNaN(n) ? '' : numberFormatter.format(n);
}
