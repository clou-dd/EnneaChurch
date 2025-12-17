// 점수 계산 로직만 분리한 파일 (규칙을 바꾸기 쉬움)

export function mapLikertQuestionToType(qid) {
    if (qid >= 1 && qid <= 9) return qid;
    if (qid >= 10 && qid <= 18) return qid - 9;
    return null;
}

// 정규화용 최대점수(고정 기준)
// Likert은 (응답-1)로 0~4점, Q19는 절반씩(0~2), Q20은 +4
export const MAX_SCORE = {
    1: 4 + 4 + 2, // Q1 + Q10 + half(Q19)
    2: 4 + 4 + 4, // Q2 + Q11 + Q20(선택 가능)
    3: 4 + 4 + 4, // Q3 + Q12 + Q20
    4: 4 + 4,     // Q4 + Q13
    5: 4 + 4,     // Q5 + Q14
    6: 4 + 4 + 2, // Q6 + Q15 + half(Q19)
    7: 4 + 4 + 4, // Q7 + Q16 + Q20
    8: 4 + 4 + 4, // Q8 + Q17 + Q20
    9: 4 + 4 + 4  // Q9 + Q18 + Q20
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
 *  - Q20(single): 20 -> type(2/3/7/8/9)
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

            if (q.id >= 1 && q.id <= 18) {
                const t = mapLikertQuestionToType(q.id);
                raw[t] += pts;
            } else if (q.id === 19) {
                raw[1] += pts * 0.5;
                raw[6] += pts * 0.5;
            }
        } else if (q.kind === "single" && q.id === 20) {
            const t = Number(answers[q.id]);
            raw[t] += 4;
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
