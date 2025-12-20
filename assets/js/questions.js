// questions.js
// - kind: "likert" | "single"
// - id: 답변 저장 키 (answers[id])
// - type: likert 문항의 점수 귀속 유형(1~9)
// - split: 분기 점수(절반씩) 문항용 { types: [1,6], ratio: 0.5 }
// - options: single 문항 선택지 [{ type, label }]

export const LIKERT_LABELS = [
	"전혀 아니다",
	"아니다",
	"보통이다",
	"그렇다",
	"매우 그렇다"
];

export const QUESTIONS = [
	{ id: 1, kind: "likert", type: 5, text: "교회 공동체에서 감정 표현이 많아지면 에너지가 쉽게 소진되는 편이다" },
	{ id: 2, kind: "likert", type: 2, text: "누군가를 충분히 챙기지 못했다고 느끼면 마음이 오래 쓰인다" },
	{ id: 3, kind: "likert", type: 8, text: "교회에서 문제를 보면 모른 척하기보다 짚고 넘어가고 싶어진다" },
	{ id: 4, kind: "likert", type: 4, text: "예배 중 마음이 깊이 움직일 때 신앙이 더 ‘진짜’처럼 느껴진다" },
	{ id: 5, kind: "likert", type: 1, text: "신앙생활에서도 ‘이 정도면 됐다’고 쉽게 넘어가기 어렵다" },
	{ id: 6, kind: "likert", type: 7, text: "신앙생활에서도 기쁨과 자유로움을 중요하게 여긴다" },
	{ id: 7, kind: "likert", type: 9, text: "갈등이 생기면 내 주장보다 조화와 분위기를 먼저 생각하는 편이다" },
	{ id: 8, kind: "likert", type: 3, text: "신앙생활에서도 성장과 열매가 보이기를 중요하게 여긴다" },
	{ id: 9, kind: "likert", type: 6, text: "신앙의 방향을 선택할 때 확신이 들기 전까지 계속 확인하게 된다" },
	{ id: 10, kind: "likert", type: 2, text: "교회 사람들의 필요를 보면 먼저 돕고 싶은 마음이 든다" },
	{ id: 11, kind: "likert", type: 9, text: "공동체의 분위기가 깨질까 봐 내 의견을 뒤로 미룰 때가 있다" },
	{ id: 12, kind: "likert", type: 5, text: "신앙은 나누는 것보다 혼자 정리하고 묵상하는 시간이 더 편하다" },
	{ id: 13, kind: "likert", type: 1, text: "교회 안에서 기준이 흐려지는 것이 보이면 마음이 불편해진다" },
	{ id: 14, kind: "likert", type: 3, text: "교회에서도 맡은 일을 유능하게 해내는 것이 중요하게 느껴진다" },
	{ id: 15, kind: "likert", type: 8, text: "부당하다고 느끼면 돌려 말하기보다 분명하게 말하는 편이다" },
	{ id: 16, kind: "likert", type: 4, text: "신앙생활에서도 내 마음의 상태와 진정성을 중요하게 여긴다" },
	{ id: 17, kind: "likert", type: 7, text: "신앙에서도 새로운 시도나 가능성을 떠올리면 마음이 쉽게 열린다" },
	{ id: 18, kind: "likert", type: 1, text: "옳다고 생각하는 방향이면 주변과 달라도 지키려는 편이다" },
	{ id: 19, kind: "likert", type: 6, text: "교회에서도 기준과 질서가 분명할 때 마음이 편하다" },
	{ id: 20, kind: "likert", type: 3, text: "‘잘하는 사람’으로 보이지 않을 때 마음이 흔들릴 때가 있다" },
	{ id: 21, kind: "likert", type: 4, text: "다른 성도들과 나 자신을 비교하며 소외감을 느낄 때가 있다" },
	{ id: 22, kind: "likert", type: 2, text: "누군가 나를 필요로 할 때 마음이 살아나는 느낌이 든다" },
	{ id: 23, kind: "likert", type: 8, text: "결정이 필요할 때 주저하기보다 빨리 정하고 나아가는 편이다" },
	{ id: 24, kind: "likert", type: 5, text: "충분히 이해되지 않으면 쉽게 행동으로 옮기지 않는다" },
	{ id: 25, kind: "likert", type: 7, text: "새로운 사역이나 시도를 들으면 마음이 설레는 편이다" },
	{ id: 26, kind: "likert", type: 9, text: "모두가 편안한 방향을 먼저 생각하게 된다" },
	{ id: 27, kind: "likert", type: 6, text: "공동체 안에서 내 책임을 소홀히 하면 마음이 불안해진다" },
	{ id: 28, kind: "likert", split: { types: [1, 6], ratio: 0.5 }, text: "신앙적으로 ‘제대로 하고 있는지’를 자주 돌아보고 확인하는 편이다" },
	{
		id: 29,
		kind: "single",
		text: "교회에서 내게 가장 자주 보이는 모습은?",
		options: [
			{ type: 2, label: "사람을 챙기고 돕는 편" },
			{ type: 3, label: "맡은 일을 잘 해내는 편" },
			{ type: 7, label: "분위기를 밝게 만드는 편" },
			{ type: 8, label: "앞장서서 결정하고 이끄는 편" },
			{ type: 9, label: "사람들 사이를 부드럽게 잇는 편" }
		]
	},
	{
		id: 30,
		kind: "single",
		text: "신앙생활에서 내 마음을 가장 자주 움직이는 내적 동기는?",
		options: [
			{ type: 1, label: "바르게 살고 싶다" },
			{ type: 4, label: "진짜 나로 서고 싶다" },
			{ type: 5, label: "충분히 이해하고 싶다" },
			{ type: 6, label: "흔들리지 않고 싶다" }
		]
	}
];
