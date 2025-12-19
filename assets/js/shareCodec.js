/**
 * shareCodec.js
 * - 9개 점수(0~100)를 Uint8Array(9)로 패킹 → Base64URL 문자열(pb)
 * - Base64URL(pb) → 9개 점수 배열로 복원
 *
 * URL 파라미터 예:
 *   ?r=1w9&pb=WgwIBQQDBgcU
 */

/** @returns {string} base64url */
export function base64UrlEncodeBytes(bytes) {
	let binary = "";
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
	const b64 = btoa(binary);
	return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** @returns {Uint8Array} */
export function base64UrlDecodeToBytes(b64url) {
	let b64 = String(b64url).replace(/-/g, "+").replace(/_/g, "/");
	const pad = b64.length % 4;
	if (pad) b64 += "=".repeat(4 - pad);
	
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

/**
 * 점수 9개(1~9유형 순서) -> pb 문자열
 * @param {number[]} percentList9 length=9, each 0..100
 * @returns {string|null}
 */
export function encodePercentsToPb(percentList9) {
	if (!Array.isArray(percentList9) || percentList9.length !== 9) return null;
	
	const bytes = new Uint8Array(9);
	for (let i = 0; i < 9; i++) {
		const n = Math.round(Number(percentList9[i]));
		if (!Number.isFinite(n) || n < 0 || n > 100) return null;
		bytes[i] = n;
	}
	return base64UrlEncodeBytes(bytes);
}

/**
 * pb 문자열 -> 점수 9개 배열
 * @param {string} pb
 * @returns {number[]|null} length=9, each 0..100
 */
export function decodePbToPercents(pb) {
	if (!pb || typeof pb !== "string") return null;
	
	let bytes;
	try {
		bytes = base64UrlDecodeToBytes(pb);
	} catch (_) {
		return null;
	}
	
	if (bytes.length !== 9) return null;
	
	const arr = Array.from(bytes);
	if (arr.some((n) => n < 0 || n > 100)) return null;
	return arr;
}
