# 교회용 에니어그램 간단 테스트 (GitHub Pages)

정적(HTML/CSS/JS)만으로 동작하는 20문항 에니어그램 참고용 테스트입니다.

## 실행
- 로컬: 폴더에서 `index.html`을 브라우저로 열면 됩니다.
- GitHub Pages:
    1) 이 폴더를 레포로 업로드
    2) Settings → Pages
    3) Deploy from a branch / Branch: main / Folder: /(root)
    4) 저장 후 제공되는 URL로 접속

## 파일 구조
- `index.html` : 화면 뼈대
- `assets/css/app.css` : 스타일
- `assets/js/questions.js` : 문항 데이터
- `assets/js/interpretations.js` : 유형별 해석 문구
- `assets/js/scoring.js` : 점수 계산/정규화/윙 로직
- `assets/js/app.js` : 렌더링/이벤트/결과 출력

## 점수 개요
- Likert(1~5) → (응답-1)로 0~4점
- Q1~18: 각 유형 2문항(1~9 두 바퀴)
- Q19: 1유형/6유형에 50%씩 분배
- Q20: 키워드 선택 유형에 +4점(타이브레이커)
- 유형별 점수는 MAX 대비 %로 정규화하여 비교

## 주의
이 테스트는 상담/치유/영성판단 도구가 아니라 ‘자기이해’ 참고 자료입니다.
