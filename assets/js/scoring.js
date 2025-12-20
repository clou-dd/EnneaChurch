// scoring.js
// 점수 계산 로직만 분리한 파일 (규칙을 바꾸기 쉬움)

// 정규화용 최대점수(고정 기준)
// Likert은 (응답-1)로 0~4점
// Q28는 절반씩(0~2씩), Q29/Q30는 선택된 타입에 +2  ✅ 변경
export const MAX_SCORE = {
	1: (4 * 3) + 2 + 2, // 1유형 Likert 3문항 + half(Q28) + Q30(선택 가능)
	2: (4 * 3) + 2,     // 2유형 Likert 3문항 + Q29
	3: (4 * 3) + 2,     // 3유형 Likert 3문항 + Q29
	4: (4 * 3) + 2,     // 4유형 Likert 3문항 + Q30
	5: (4 * 3) + 2,     // 5유형 Likert 3문항 + Q30
	6: (4 * 3) + 2 + 2, // 6유형 Likert 3문항 + half(Q28) + Q30
	7: (4 * 3) + 2,     // 7유형 Likert 3문항 + Q29
	8: (4 * 3) + 2,     // 8유형 Likert 3문항 + Q29
	9: (4 * 3) + 2      // 9유형 Likert 3문항 + Q29
};

export function getWing(mainType, percents) {
	const lr = {
		1: [9, 2],
		2: [1, 3],
		3: [2, 4],
		4: [3, 5],
		5: [4, 6],
		6: [5, 7],
		7: [6, 8],
		8: [7, 9],
		9: [8, 1]
	};
	const [a, b] = lr[mainType];
	return (percents[a] >= percents[b]) ? a : b;
}

function initRaw() {
	return { 1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0 };
}

function isValidType(t) {
	return Number.isInteger(t) && t >= 1 && t <= 9;
}

// ✅ Likert 입력 방어(1~5 범위 밖 값/NaN 대비)
function clampLikertToPts(v) {
	const n = Number(v);
	if (!Number.isFinite(n)) return 0;
	// 기대 범위: 1~5 → pts 0~4
	const clamped = Math.max(1, Math.min(5, n));
	return clamped - 1;
}

export function calcScores(questions, answers) {
	const missing = [];
	for (const q of questions) {
		if (answers[q.id] == null) missing.push(q.id);
	}
	if (missing.length) return { ok: false, missing };

	const raw = initRaw();

	for (const q of questions) {
		if (q.kind === "likert") {
			// const v = Number(answers[q.id]); // 1~5
			// const pts = v - 1;               // 0~4
			const pts = clampLikertToPts(answers[q.id]); // ✅ 0~4로 안전 처리

			// ✅ 일반 likert: q.type에 귀속
			if (isValidType(q.type)) {
				raw[q.type] += pts;
				continue;
			}

			// ✅ 분기 likert: q.split.types에 ratio만큼 분배
			if (q.split && Array.isArray(q.split.types) && typeof q.split.ratio === "number") {
				const ratio = q.split.ratio;
				for (const t of q.split.types) {
					if (isValidType(t)) raw[t] += pts * ratio;
				}
			}

		} else if (q.kind === "single") {
			const pickedType = Number(answers[q.id]);

			// ✅ options 기반 검증 후 +2  (기존 +4에서 변경)
			if (Array.isArray(q.options) && q.options.length) {
				const allowed = q.options.some(o => Number(o.type) === pickedType);
				if (allowed && isValidType(pickedType)) raw[pickedType] += 2;
			}
		}
	}

	const percent = {};
	for (let t = 1; t <= 9; t++) {
		percent[t] = Math.round((raw[t] / MAX_SCORE[t]) * 100);
	}

	const sorted = Object.keys(percent)
		.map(k => ({ type: Number(k), pct: percent[k], raw: raw[k] }))
		.sort((a, b) => b.pct - a.pct);

	const main = sorted[0].type;

	// ✅ 날개는 무조건 양옆(인접)에서만 선택
	const wing = getWing(main, percent);

	return { ok: true, raw, percent, sorted, main, wing };
}
