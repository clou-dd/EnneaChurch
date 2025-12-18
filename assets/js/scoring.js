// 점수 계산 로직만 분리한 파일 (규칙을 바꾸기 쉬움)

// ✅ 30문항 규칙(가공본)
// - Likert: Q1~Q27 (각 응답 1~5 → (응답-1)로 0~4점)
//   * Q1~Q9   → 유형 1~9
//   * Q10~Q18 → 유형 1~9
//   * Q19~Q27 → 유형 1~9
// - Likert 특수: Q28 → 유형 1,6에 절반씩(0~2씩)
// - single: Q29 → {2,3,7,8,9} 중 1개 선택(+4)
// - single: Q30 → {1,4,5,6} 중 1개 선택(+4)

export function mapLikertQuestionToType(qid) {
	// 1~9 => 1~9
	if (qid >= 1 && qid <= 9) return qid;
	// 10~18 => 1~9
	if (qid >= 10 && qid <= 18) return qid - 9;
	// 19~27 => 1~9
	if (qid >= 19 && qid <= 27) return qid - 18;
	return null;
}

// single 문항에서 선택 가능한 타입(가정)
export const SINGLE_Q29_TYPES = [2, 3, 7, 8, 9];
export const SINGLE_Q30_TYPES = [1, 4, 5, 6];

// 정규화용 최대점수(고정 기준)
// Likert은 (응답-1)로 0~4점
// Q28은 절반씩(0~2씩), Q29/Q30은 선택된 타입에 +4
export const MAX_SCORE = {
	1: (4 * 3) + 2 + 4, // Q1/Q10/Q19 + half(Q28) + Q30(선택 가능)
	2: (4 * 3) + 4,     // Q2/Q11/Q20 + Q29(선택 가능)
	3: (4 * 3) + 4,     // Q3/Q12/Q21 + Q29
	4: (4 * 3) + 4,     // Q4/Q13/Q22 + Q30
	5: (4 * 3) + 4,     // Q5/Q14/Q23 + Q30
	6: (4 * 3) + 2 + 4, // Q6/Q15/Q24 + half(Q28) + Q30
	7: (4 * 3) + 4,     // Q7/Q16/Q25 + Q29
	8: (4 * 3) + 4,     // Q8/Q17/Q26 + Q29
	9: (4 * 3) + 4      // Q9/Q18/Q27 + Q29
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

/**
 * answers:
 *  - likert 문항: qid -> 1~5
 *  - Q29(single): 29 -> type(2/3/7/8/9)
 *  - Q30(single): 30 -> type(1/4/5/6)
 */
export function calcScores(questions, answers) {
	const missing = [];
	for (const q of questions) {
		if (answers[q.id] == null) missing.push(q.id);
	}
	if (missing.length) return { ok: false, missing };
	
	const raw = { 1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0 };
	
	for (const q of questions) {
		if (q.kind === "likert") {
			const v = Number(answers[q.id]); // 1~5
			const pts = v - 1;               // 0~4
			
			if (q.id >= 1 && q.id <= 27) {
				const t = mapLikertQuestionToType(q.id);
				if (t != null) raw[t] += pts;
			} else if (q.id === 28) {
				raw[1] += pts * 0.5;
				raw[6] += pts * 0.5;
			}
		} else if (q.kind === "single" && q.id === 29) {
			const t = Number(answers[q.id]);
			// 안전장치(선택지가 틀려도 점수 오염 방지)
			if (SINGLE_Q29_TYPES.includes(t)) raw[t] += 4;
		} else if (q.kind === "single" && q.id === 30) {
			const t = Number(answers[q.id]);
			if (SINGLE_Q30_TYPES.includes(t)) raw[t] += 4;
		}
	}
	
	const percent = {};
	for (let t = 1; t <= 9; t++) {
		percent[t] = Math.round((raw[t] / MAX_SCORE[t]) * 100);
	}
	
	const sorted = Object.keys(percent)
		.map(k => ({ type: Number(k), pct: percent[k], raw: raw[k] }))
		.sort((a,b) => b.pct - a.pct);
	
	const main = sorted[0].type;
	const wing = getWing(main, percent);
	
	return { ok: true, raw, percent, sorted, main, wing };
}
