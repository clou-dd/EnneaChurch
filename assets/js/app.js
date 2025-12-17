import { QUESTIONS, LIKERT_LABELS } from "./questions.js";
import { TYPE_INFO } from "./interpretations.js";
import { calcScores } from "./scoring.js";

const $stage = document.getElementById("stage");
const $progressBar = document.getElementById("progressBar");
const $btnStartOver = document.getElementById("btnStartOver");

const answers = {}; // qid -> likert(1~5) or single(type)
let step = 0;       // 0..(QUESTIONS.length)  (QUESTIONS.length는 결과 페이지)

// -----------------------------
// Pastel background themes
// -----------------------------
const PASTEL_THEMES = [
    {
        bg1: "#f8fafc",
        bg2: "#f1f5f9",
        accent1: "rgba(186,230,253,0.35)", // sky
        accent2: "rgba(221,214,254,0.28)"  // violet
    },
    {
        bg1: "#fff7ed",
        bg2: "#ffedd5",
        accent1: "rgba(254,215,170,0.35)", // peach
        accent2: "rgba(251,207,232,0.28)"  // pink
    },
    {
        bg1: "#f0fdf4",
        bg2: "#dcfce7",
        accent1: "rgba(187,247,208,0.35)", // mint
        accent2: "rgba(204,251,241,0.28)"  // teal
    },
    {
        bg1: "#f5f3ff",
        bg2: "#ede9fe",
        accent1: "rgba(216,180,254,0.35)", // lavender
        accent2: "rgba(199,210,254,0.28)"  // indigo
    },
    {
        bg1: "#fff1f2",
        bg2: "#ffe4e6",
        accent1: "rgba(254,205,211,0.35)", // rose
        accent2: "rgba(251,182,206,0.28)"  // soft pink
    }
];

// 랜덤 선택
const pastel = PASTEL_THEMES[Math.floor(Math.random() * PASTEL_THEMES.length)];

// CSS 변수 적용
const root = document.documentElement;
root.style.setProperty("--bg1", pastel.bg1);
root.style.setProperty("--bg2", pastel.bg2);
root.style.setProperty("--accent1", pastel.accent1);
root.style.setProperty("--accent2", pastel.accent2);

// ---------------- utils ----------------
function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function setProgress() {
    const totalSteps = QUESTIONS.length + 1; // 문항 + 결과
    const pct = Math.round((step / (totalSteps - 1)) * 100);
    $progressBar.style.width = `${pct}%`;
}

function typeLabel(t) {
    return `${t}유형`;
}

function scrollTopSmooth() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------------- render ----------------
function render() {
    setProgress();

    // 결과 페이지
    if (step === QUESTIONS.length) {
        renderResultPage();
        return;
    }

    const q = QUESTIONS[step];
    if (!q) return;

    const currentIndex = step + 1;
    const total = QUESTIONS.length;

    const selected = answers[q.id];

    const html = `
    <div class="card fadeIn">
      <div class="card__header">
        <div class="kicker">${currentIndex} / ${total}</div>
        <h2 class="title">Q${q.id}. ${escapeHtml(q.text)}</h2>
      </div>
      <div class="card__body">
        <p class="hint">선택한 뒤 “다음”을 눌러 진행합니다.</p>

        ${q.kind === "likert" ? renderLikertBlock(q, selected) : renderSingleBlock(q, selected)}

        <div class="error" id="err" style="display:none;"></div>

        <div class="actions">
          <button class="btn btn--ghost" id="btnPrev" type="button" ${step === 0 ? "disabled" : ""}>이전</button>
          <button class="btn btn--primary" id="btnNext" type="button">다음</button>
        </div>
      </div>
    </div>
  `;

    $stage.innerHTML = html;

    bindQuestionEvents(q);
    bindNavEvents(q);
}

function renderLikertBlock(q, selected) {
    const opts = Array.from({ length: 5 }, (_, i) => {
        const v = i + 1;
        const sel = (Number(selected) === v) ? "selected" : "";
        return `
      <label class="opt ${sel}" data-qid="${q.id}" data-kind="likert" data-value="${v}">
        <input type="radio" name="q${q.id}" value="${v}">
        <div class="opt__num">${v}</div>
        <div class="opt__lab">${escapeHtml(LIKERT_LABELS[i])}</div>
      </label>
    `;
    }).join("");

    return `<div class="scale" id="block">${opts}</div>`;
}

function renderSingleBlock(q, selected) {

    // Q20 전용: 라디오 리스트형
    if (q.id === 20) {
        const items = q.options.map(opt => {
            const sel = Number(selected) === Number(opt.type) ? "selected" : "";
            return `
        <div class="radioItem ${sel}" data-qid="${q.id}" data-kind="single" data-value="${opt.type}">
          <div class="radioBullet"></div>
          <div class="radioText">
            <div class="radioTitle">${escapeHtml(opt.label)}</div>
            <div class="radioDesc">${escapeHtml(opt.desc)}</div>
          </div>
        </div>
      `;
        }).join("");

        return `<div class="radioList" id="block">${items}</div>`;
    }

    // 기존(짧은 문구용)
    const opts = q.options.map(opt => {
        const sel = (Number(selected) === Number(opt.type)) ? "selected" : "";
        return `
      <div class="singleOpt ${sel}" data-qid="${q.id}" data-kind="single" data-value="${opt.type}">
        <div class="singleOpt__top">${escapeHtml(opt.label)}</div>
        <div class="singleOpt__sub">${escapeHtml(opt.desc ?? "")}</div>
      </div>
    `;
    }).join("");

    return `
    <div class="singleGrid" id="block">${opts}</div>
    <p class="hint" style="margin-top:10px;">※ 하나만 선택</p>
  `;
}

function bindQuestionEvents(q) {
    const block = document.getElementById("block");
    if (!block) return;

    block.addEventListener("click", (e) => {
        const el = e.target.closest("[data-qid]");
        if (!el) return;

        const qid = Number(el.dataset.qid);
        const kind = el.dataset.kind;
        const value = Number(el.dataset.value);

        // 저장
        if (kind === "likert") answers[qid] = value;
        if (kind === "single") answers[qid] = value;

        // UI selected
        [...block.querySelectorAll(".selected")].forEach(x => x.classList.remove("selected"));
        el.classList.add("selected");

        // 에러 숨김
        const err = document.getElementById("err");
        if (err) err.style.display = "none";
    });
}

function bindNavEvents(q) {
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");

    if (btnPrev) {
        btnPrev.addEventListener("click", () => {
            if (step > 0) {
                step -= 1;
                render();
                scrollTopSmooth();
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener("click", () => {
            // 다음으로 가기 전 응답 체크
            const v = answers[q.id];
            if (v == null) {
                const err = document.getElementById("err");
                if (err) {
                    err.textContent = "응답을 선택해 주세요.";
                    err.style.display = "block";
                }
                return;
            }

            // 마지막 문항이면 결과로
            if (step === QUESTIONS.length - 1) {
                step = QUESTIONS.length;
            } else {
                step += 1;
            }
            render();
            scrollTopSmooth();
        });
    }

    // 키보드(선택 + 이동) — 선택사항이지만 UX 좋아짐
    window.onkeydown = (ev) => {
        if (step === QUESTIONS.length) return; // 결과 페이지에서는 키보드 처리 제외

        if (ev.key === "ArrowLeft") {
            if (step > 0) {
                step -= 1;
                render();
                scrollTopSmooth();
            }
        } else if (ev.key === "ArrowRight" || ev.key === "Enter") {
            const v = answers[q.id];
            if (v == null) return;
            if (step === QUESTIONS.length - 1) step = QUESTIONS.length;
            else step += 1;
            render();
            scrollTopSmooth();
        } else if (q.kind === "likert") {
            // 1~5 숫자키로 바로 선택
            const n = Number(ev.key);
            if (n >= 1 && n <= 5) {
                answers[q.id] = n;
                render(); // 간단히 재렌더로 선택 표시
            }
        }
    };
}

// ---------------- result page ----------------
function renderResultPage() {
    const res = calcScores(QUESTIONS, answers);

    // calcScores는 전체 미응답 체크도 하지만,
    // 여기까지 왔다면 정상적으로 다 응답한 상태여야 합니다.
    if (!res.ok) {
        // 안전장치
        step = 0;
        render();
        return;
    }

    const top3 = res.sorted.slice(0, 3).map(x => `${x.type}유형 ${x.pct}%`).join(" · ");
    const info = TYPE_INFO[res.main];
    const wingInfo = TYPE_INFO[res.wing];

    const barsHtml = Array.from({ length: 9 }, (_, i) => {
        const t = i + 1;
        return `
      <div class="bar-row">
        <div style="font-weight:900;">${t}</div>
        <div class="bar"><div style="width:${res.percent[t]}%"></div></div>
        <div style="text-align:right; font-weight:900;">${res.percent[t]}%</div>
      </div>
    `;
    }).join("");

    const html = `
    <div class="card fadeIn">
      <div class="card__header">
        <div class="kicker">결과</div>
        <h2 class="title">당신은 ${res.main}번 유형 · ${res.wing}번 날개(${res.main}w${res.wing})</h2>

        <div class="badgeRow">
          <span class="badge badge--accent">Top3: ${escapeHtml(top3)}</span>
          <span class="badge">요약: ${escapeHtml(info.name)}</span>
        </div>
      </div>

      <div class="card__body">
        <p class="hint">
          아래 점수는 “유형 가능성”을 보여줍니다. 상황(스트레스/회복/역할)에 따라 달라질 수 있습니다.
        </p>

        <div class="bars">${barsHtml}</div>

        <div class="typebox">
          <h3>${res.main}유형: ${escapeHtml(info.name)} <span style="color:#64748b;font-weight:800;">(날개: ${res.main}w${res.wing} — ${escapeHtml(wingInfo.name)})</span></h3>

          <div class="hr"></div>
          <b>강점(공동체에 주는 유익)</b>
          <ul>${info.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul>

          <div class="hr"></div>
          <b>주의(흔한 함정)</b>
          <ul>${info.blindspots.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul>

          <div class="hr"></div>
          <b>성장 포인트(실천 제안)</b>
          <ul>${info.growth.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul>

          <div class="hr"></div>
          <b>날개 설명</b>
          <div class="hint" style="margin:8px 0 0;">
            <b>${res.main}w${res.wing}</b>는 기본 성향(${res.main}) 위에 인접 유형(${res.wing})의 색이 얹혀 나타날 수 있습니다.
            말투/결정 속도/관계 방식에서 ${res.wing}유형의 특징이 더 도드라질 때가 있습니다.
          </div>
        </div>

        <div class="actions">
          <button class="btn btn--ghost" id="btnBackToLast" type="button">마지막 문항으로</button>
          <button class="btn btn--primary" id="btnRestart" type="button">다시 하기</button>
        </div>
      </div>
    </div>
  `;

    $stage.innerHTML = html;

    document.getElementById("btnRestart")?.addEventListener("click", () => {
        resetAll();
    });

    document.getElementById("btnBackToLast")?.addEventListener("click", () => {
        step = QUESTIONS.length - 1;
        render();
        scrollTopSmooth();
    });

    // 결과 페이지에서는 키보드 핸들러 제거(원치 않는 동작 방지)
    window.onkeydown = null;
}

// ---------------- actions ----------------
function resetAll() {
    for (const k of Object.keys(answers)) delete answers[k];
    step = 0;
    render();
    scrollTopSmooth();
}

$btnStartOver.addEventListener("click", resetAll);

// init
render();
