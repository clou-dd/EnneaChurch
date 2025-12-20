// scoring.js
// 점수 계산 로직만 분리한 파일 (규칙을 바꾸기 쉬움)

// Likert 응답값: 1~5  → (응답-1)로 0~4점
const LIKERT_MAX_POINTS = 4;

// single 문항 가중치(권장: 2)
const SINGLE_POINTS = 2;

// - Likert 기반 Top1과 Top2의 차이가 이 값 이하이면 single 반영
// - 권장: 3~5
const TIE_THRESHOLD_PCT = 4;

function initRaw() {
	return { 1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0 };
}

function isValidType(t) {
	return Number.isInteger(t) && t >= 1 && t <= 9;
}

function clamp(n, min, max) {
	return Math.max(min, Math.min(max, n));
}

// MAX_SCORE를 questions 기반으로 자동 계산 (질문 변경에도 안전)
function calcMaxScoreByQuestions(questions, mode = "all") {
	// mode: "all" | "likertOnly"
	const max = initRaw();

	for (const q of questions) {
		if (q.kind === "likert") {
			// 일반 likert: q.type에 최대 4점
			if (isValidType(q.type)) {
				max[q.type] += LIKERT_MAX_POINTS;
				continue;
			}

			// split likert: ratio 만큼 분배된 최대점수 반영
			if (q.split && Array.isArray(q.split.types) && typeof q.split.ratio === "number") {
				const ratio = q.split.ratio;
				const add = LIKERT_MAX_POINTS * ratio;
				for (const t of q.split.types) {
					if (isValidType(t)) max[t] += add;
				}
			}
		} else if (q.kind === "single") {
			if (mode === "likertOnly") continue;

			// single: 해당 타입을 선택할 수 있으면 그 타입의 최대점수에 SINGLE_POINTS를 더해 둠
			if (Array.isArray(q.options) && q.options.length) {
				for (const opt of q.options) {
					const t = Number(opt.type);
					if (isValidType(t)) max[t] += SINGLE_POINTS;
				}
			}
		}
	}

	return max;
}

function buildPercent(raw, maxScore) {
	const percent = {};
	for (let t = 1; t <= 9; t++) {
		const max = maxScore[t] || 1; // 0 방지
		percent[t] = Math.round((raw[t] / max) * 100);
	}
	return percent;
}

function buildSorted(percent, raw) {
	return Object.keys(percent)
		.map(k => ({ type: Number(k), pct: percent[k], raw: raw[Number(k)] }))
		.sort((a, b) => {
			if (b.pct !== a.pct) return b.pct - a.pct;
			return b.raw - a.raw;
		});
}

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

function addLikertScores(questions, answers, raw) {
	for (const q of questions) {
		if (q.kind !== "likert") continue;

		const v = Number(answers[q.id]);     // 기대: 1~5
		const pts = clamp(v - 1, 0, 4);      // 0~4로 방어

		// 일반 likert
		if (isValidType(q.type)) {
			raw[q.type] += pts;
			continue;
		}

		// split likert
		if (q.split && Array.isArray(q.split.types) && typeof q.split.ratio === "number") {
			const ratio = q.split.ratio;
			for (const t of q.split.types) {
				if (isValidType(t)) raw[t] += pts * ratio;
			}
		}
	}
}

function addSingleScores(questions, answers, raw) {
	for (const q of questions) {
		if (q.kind !== "single") continue;

		const pickedType = Number(answers[q.id]);

		// options 기반 검증 후 +SINGLE_POINTS
		if (Array.isArray(q.options) && q.options.length) {
			const allowed = q.options.some(o => Number(o.type) === pickedType);
			if (allowed && isValidType(pickedType)) raw[pickedType] += SINGLE_POINTS;
		}
	}
}

export function calcScores(questions, answers) {
	// 1) 누락 체크 (single도 항상 질문받는 전제 유지)
	const missing = [];
	for (const q of questions) {
		if (answers[q.id] == null) missing.push(q.id);
	}
	if (missing.length) return { ok: false, missing };

	// 2) 1차: Likert만으로 계산
	const rawLikert = initRaw();
	addLikertScores(questions, answers, rawLikert);

	const MAX_LIKERT = calcMaxScoreByQuestions(questions, "likertOnly");
	const percentLikert = buildPercent(rawLikert, MAX_LIKERT);
	const sortedLikert = buildSorted(percentLikert, rawLikert);

	const mainLikert = sortedLikert[0]?.type ?? 1;
	const secondLikert = sortedLikert[1]?.type ?? getWing(mainLikert, percentLikert);

	const gap = Math.abs((percentLikert[mainLikert] ?? 0) - (percentLikert[secondLikert] ?? 0));
	const isTie = gap <= TIE_THRESHOLD_PCT;

	// 3) 2차: 근접이면 single 반영해서 최종 계산, 아니면 Likert 결과를 그대로 사용
	let rawFinal = rawLikert;
	let percentFinal = percentLikert;
	let sortedFinal = sortedLikert;

	if (isTie) {
		rawFinal = { ...rawLikert }; // 복사 후 single 가산
		addSingleScores(questions, answers, rawFinal);

		const MAX_ALL = calcMaxScoreByQuestions(questions, "all");
		percentFinal = buildPercent(rawFinal, MAX_ALL);
		sortedFinal = buildSorted(percentFinal, rawFinal);
	}

	const main = sortedFinal[0].type;
	const wing = getWing(main, percentFinal);

	return {
		ok: true,

		// ✅ 최종 결과
		raw: rawFinal,
		percent: percentFinal,
		sorted: sortedFinal,
		main,
		wing,

		// ✅ 디버깅/설명용(필요하면 UI에서 활용)
		tie: {
			usedSingle: isTie,
			thresholdPct: TIE_THRESHOLD_PCT,
			gapPct: gap,
			likertTop1: mainLikert,
			likertTop2: secondLikert,
			likertPercent: percentLikert
		}
	};
}
