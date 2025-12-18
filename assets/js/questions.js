// assets/js/questions.js

export const LIKERT_LABELS = [
	"전혀 그렇지 않다",
	"그렇지 않은 편이다",
	"보통이다",
	"그런 편이다",
	"매우 그렇다"
];

/**
 * kind:
 * - "likert": 1~5 척도
 * - "single": 단일 선택 (유형 노출 없이 가치 언어로 선택)
 *
 * scoring:
 * - likert 문항은 typeKey에 점수 누적
 * - single 문항은 선택한 옵션.type에 점수 부여
 */
export const QUESTIONS = [
	// 1~10
	{ id: 1,  kind: "likert", text: "일을 맡게 되면 기준에 맞게 제대로 해내고 싶은 마음이 먼저 든다." },
	{ id: 2,  kind: "likert", text: "주변 사람들이 필요로 하는 것을 빠르게 알아차리는 편이다." },
	{ id: 3,  kind: "likert", text: "맡은 일에서 좋은 결과를 내고 인정받는 것이 중요하다." },
	{ id: 4,  kind: "likert", text: "나만의 감정과 생각을 깊이 들여다보는 시간이 필요하다." },
	{ id: 5,  kind: "likert", text: "사람들과 함께 있기보다 혼자 정리하는 시간이 더 편하다." },
	{ id: 6,  kind: "likert", text: "결정을 내릴 때 혹시 문제가 생기지 않을지 먼저 생각한다." },
	{ id: 7,  kind: "likert", text: "답답한 분위기보다는 밝고 즐거운 방향을 찾으려 한다." },
	{ id: 8,  kind: "likert", text: "상황이 불분명할 때 내가 나서서 정리해야 한다고 느낀다." },
	{ id: 9,  kind: "likert", text: "갈등이 생기면 중재하거나 조용히 넘기고 싶은 마음이 든다." },
	{ id: 10, kind: "likert", text: "내 선택이 옳은지 스스로에게 자주 묻는다." },
	
	// 11~20 (교회/공동체)
	{ id: 11, kind: "likert", text: "교회에서 맡은 역할은 책임감을 가지고 끝까지 지키려 한다." },
	{ id: 12, kind: "likert", text: "누군가 힘들어 보이면 말보다 행동으로 돕고 싶어진다." },
	{ id: 13, kind: "likert", text: "사역이나 봉사에서도 성과와 효율을 중요하게 생각한다." },
	{ id: 14, kind: "likert", text: "예배나 말씀을 통해 내 마음이 깊이 움직이는 경험을 중요하게 여긴다." },
	{ id: 15, kind: "likert", text: "소그룹에서 말하기보다 듣고 정리하는 역할이 편하다." },
	{ id: 16, kind: "likert", text: "공동체의 방향이나 결정이 안정적인지 자주 점검한다." },
	{ id: 17, kind: "likert", text: "교회 분위기가 무거워지면 자연스럽게 분위기를 바꾸려 한다." },
	{ id: 18, kind: "likert", text: "문제가 생기면 누군가는 강하게 책임지고 나서야 한다고 느낀다." },
	{ id: 19, kind: "likert", text: "의견 차이가 생기면 굳이 맞서기보다 양보하는 편이다." },
	{ id: 20, kind: "likert", text: "공동체 안에서 조화롭게 지내는 것이 무엇보다 중요하다." },
	
	// 21~29 (갈등/선택/태도)
	{ id: 21, kind: "likert", text: "실수했을 때 스스로를 많이 책망하는 편이다." },
	{ id: 22, kind: "likert", text: "다른 사람의 기대를 저버리지 않으려 애쓴다." },
	{ id: 23, kind: "likert", text: "실패보다는 성공 가능성이 높은 선택을 하려 한다." },
	{ id: 24, kind: "likert", text: "내 감정을 있는 그대로 이해받고 싶다는 욕구가 있다." },
	{ id: 25, kind: "likert", text: "충분히 이해되지 않은 상태에서는 행동하지 않으려 한다." },
	{ id: 26, kind: "likert", text: "최악의 상황을 미리 대비해 두면 마음이 놓인다." },
	{ id: 27, kind: "likert", text: "어려운 상황에서도 긍정적인 면을 찾으려 한다." },
	{ id: 28, kind: "likert", text: "부당하다고 느끼면 침묵하지 않고 표현하는 편이다." },
	{ id: 29, kind: "likert", text: "내 의견보다 전체의 분위기를 우선 고려한다." },
	
	// 30 (유형명 노출 없이 가치/동기 기반 선택)
	{
		id: 30,
		kind: "single",
		text: "교회 공동체에서 나를 가장 잘 설명하는 키워드 하나를 고른다면?",
		options: [
			{ label: "조화", type: 9, desc: "분위기를 편안하게 만들고 갈등을 줄이는 쪽이 중요하게 느껴진다" },
			{ label: "헌신", type: 2, desc: "사람을 챙기고 섬기는 방향에 마음이 더 기울어진다" },
			{ label: "성장", type: 3, desc: "지금보다 더 잘해내고 발전하는 쪽에 동기부여가 된다" },
			{ label: "보호", type: 8, desc: "누군가를 지켜주고 책임지는 역할이 중요하게 느껴진다" },
			{ label: "자유", type: 7, desc: "가볍고 유연한 태도로 기쁨을 유지하는 것이 중요하게 느껴진다" }
		]
	}
];
