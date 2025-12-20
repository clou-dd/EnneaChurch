// questions.js
// - kind: "likert" | "single"
// - id: 답변 저장 키 (answers[id])
// - type: likert 문항의 점수 귀속 유형(1~9)
// - split: 분기 점수(절반씩) 문항용 { types: [1,6], ratio: 0.5 }
// - options: single 문항 선택지 [{ type, label }]

// 기존 app.js, renderLikertBlock에서 사용하는 라벨
export const LIKERT_LABELS = [
	"전혀 아니다",
	"아니다",
	"보통이다",
	"그렇다",
	"매우 그렇다"
];

export const QUESTIONS = [
	// ✅ 섞인 순서(유형별로 연속되지 않게)
	{ id: 1, kind: "likert", type: 5, text: "감정 표현이 많은 공동체 안에서 에너지가 쉽게 소진된다" },
	{ id: 2,  kind: "likert", type: 2, text: "도움을 주지 못했을 때 괜히 미안해진다" },
	{ id: 3, kind: "likert", type: 8, text: "교회 안에서 문제가 보이면 그냥 지나치기 어렵다" },
	{ id: 4, kind: "likert", type: 4, text: "예배 중 감정이 깊이 움직일 때 하나님과 더 가까움을 느낀다" },
	{ id: 5,  kind: "likert", type: 1, text: "신앙생활에서도 “이 정도면 충분하다”라는 말에 쉽게 동의하지 않는다" },
	{ id: 6, kind: "likert", type: 7, text: "신앙은 자유롭고 기쁨이 있어야 한다고 느낀다" },
	{ id: 7, kind: "likert", type: 9, text: "갈등 상황에서는 중재자가 되는 편이다" },
	{ id: 8,  kind: "likert", type: 3, text: "신앙생활의 열매가 눈에 보이지 않으면 조급해진다" },
	{ id: 9, kind: "likert", type: 6, text: "신앙적으로도 “이 길이 맞는지” 계속 점검하게 된다" },
	{ id: 10,  kind: "likert", type: 2, text: "교회 사람들의 필요를 보면 먼저 돕고 싶은 마음이 든다" },
	{ id: 11, kind: "likert", type: 9, text: "공동체의 분위기가 깨질까 봐 내 의견을 숨길 때가 있다" },
	{ id: 12, kind: "likert", type: 5, text: "신앙에 대해 말하기보다 혼자 묵상하는 시간이 편하다" },
	{ id: 13,  kind: "likert", type: 1, text: "교회 안에서 기준이 흐려지는 것이 보이면 마음이 불편해진다" },
	{ id: 14,  kind: "likert", type: 3, text: "교회에서도 맡은 역할은 잘 해내고 싶다" },
	{ id: 15, kind: "likert", type: 8, text: "약한 사람이 부당한 상황에 놓이면 대신 나서고 싶어진다" },
	{ id: 16, kind: "likert", type: 4, text: "신앙생활에서도 내 마음의 상태를 중요하게 여긴다" },
	{ id: 17, kind: "likert", type: 7, text: "신앙적인 고민이 길어지면 다른 일로 전환하고 싶어진다" },
	{ id: 18,  kind: "likert", type: 1, text: "옳은 방향이라고 생각하면 혼자서라도 지키려는 편이다" },
	{ id: 19, kind: "likert", type: 6, text: "기준과 질서가 분명할 때 마음이 편하다" },
	{ id: 20,  kind: "likert", type: 3, text: "“잘하는 사람”으로 보이지 않을 때 마음이 흔들린다" },
	{ id: 21, kind: "likert", type: 4, text: "다른 성도들과 나 자신을 비교하며 소외감을 느낄 때가 있다" },
	{ id: 22,  kind: "likert", type: 2, text: "누군가 나를 필요로 할 때 신앙적으로 더 살아 있는 느낌이 든다" },
	{ id: 23, kind: "likert", type: 8, text: "결단이 필요한 순간에 망설이는 것이 답답하다" },
	{ id: 24, kind: "likert", type: 5, text: "충분히 이해되지 않으면 쉽게 행동으로 옮기지 않는다" },
	{ id: 25, kind: "likert", type: 7, text: "새로운 사역이나 시도를 들으면 마음이 설렌다" },
	{ id: 26, kind: "likert", type: 9, text: "모두가 편안한 방향을 먼저 생각하게 된다" },
	{ id: 27, kind: "likert", type: 6, text: "공동체 안에서 내가 맡은 책임을 소홀히 하면 불안해진다" },

	// ✅ Q28: 1유형/6유형에 절반씩 분배(기존 scoring 로직의 half 문항 역할)
	{ id: 28, kind: "likert", split: { types: [1, 6], ratio: 0.5 }, text: "신앙적으로 “제대로 하고 있는지” 자주 스스로를 점검한다" },

	// ✅ Q29: single (2/3/7/8/9 중 택1)
	{
		id: 29,
		kind: "single",
		text: "교회에서 가장 자주 드러나는 나의 모습은?",
		options: [
			{ type: 2, label: "돕고 챙기는 사람" },
			{ type: 3, label: "맡은 일을 잘 해내는 사람" },
			{ type: 7, label: "분위기를 밝게 만드는 사람" },
			{ type: 8, label: "앞장서서 이끄는 사람" },
			{ type: 9, label: "사람들 사이를 부드럽게 잇는 사람" }
		]
	},

	// ✅ Q30: single (1/4/5/6 중 택1)
	{
		id: 30,
		kind: "single",
		text: "신앙적으로 가장 자주 느끼는 내적 동기는?",
		options: [
			{ type: 1, label: "바르게 살고 싶다" },
			{ type: 4, label: "진짜 나로 서고 싶다" },
			{ type: 5, label: "충분히 이해하고 싶다" },
			{ type: 6, label: "흔들리지 않고 싶다" }
		]
	}
];
