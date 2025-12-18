import { QUESTIONS, LIKERT_LABELS } from "./questions.js";
import { TYPE_INFO } from "./interpretations.js";
import { calcScores } from "./scoring.js";

const $stage = document.getElementById("stage");
const $progressBar = document.getElementById("progressBar");
const $btnStartOver = document.getElementById("btnStartOver");
const $year = document.getElementById("year");

const answers = {}; // qid -> likert(1~5) or single(type)
let step = -1; // -1: start, 0..QUESTIONS.length-1: questions, QUESTIONS.length: result

// ---------------- utils ----------------
function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function setProgress() {
    if (!$progressBar) return;

    const total = QUESTIONS.length;

    // start page
    if (step < 0) {
        $progressBar.style.width = "0%";
        return;
    }

    // result page or beyond
    if (step >= total) {
        $progressBar.style.width = "100%";
        return;
    }

    // question pages: 0..total-1 -> 0..100
    const denom = Math.max(1, total - 1);
    const pct = Math.round((step / denom) * 100);
    $progressBar.style.width = `${clamp(pct, 0, 100)}%`;
}

function scrollTopSmooth() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showError(msg) {
    const err = document.getElementById("err");
    if (!err) return;
    err.textContent = msg;
    err.classList.add("is-show");
}

function hideError() {
    const err = document.getElementById("err");
    if (!err) return;
    err.textContent = "";
    err.classList.remove("is-show");
}

// ---------------- render ----------------
function render() {
    // start
    if (step < 0) {
        setProgress();
        renderStartPage();
        return;
    }

    // result
    if (step === QUESTIONS.length) {
        setProgress();
        renderResultPage();
        return;
    }

    // question page
    setProgress();

    const q = QUESTIONS[step];
    if (!q) return;

    const currentIndex = step + 1;
    const total = QUESTIONS.length;
    const selected = answers[q.id];

    const html = `
    <div class="backScreen">
        <div class="card fadeIn">
          <div class="card__header">
            <div class="kicker">${currentIndex} / ${total}</div>
            <h2 class="title">Q${q.id}. ${escapeHtml(q.text)}</h2>
          </div>
    
          <div class="card__body">
            <p class="hint">선택한 뒤 “다음”을 눌러 진행합니다.</p>
    
            ${q.kind === "likert" ? renderLikertBlock(q, selected) : renderSingleBlock(q, selected)}
    
            <div class="error" id="err"></div>
    
            <div class="actions">
              <button class="btn btn--ghost" id="btnPrev" type="button" ${step === 0 ? "disabled" : ""}>이전</button>
              <button class="btn btn--primary" id="btnNext" type="button">다음</button>
            </div>
          </div>
        </div>
    </div>
  `;

    $stage.innerHTML = html;

    bindQuestionEvents(q);
    bindNavEvents(q);
}

function renderStartPage() {
    const total = QUESTIONS.length;

    const html = `
    <div class="backScreen">
      <div class="card fadeIn startCard">
        <div class="card__header">
          <div class="kicker">에니어그램 테스트</div>
          <h2 class="title">총 ${total}문항</h2>
        </div>

        <div class="card__body">
          <p class="mainDesc">
            본 테스트 결과는 개인의 성향을 단정하거나<br/>
            신앙의 성숙도, 영성의 깊이를 평가하지 않습니다.<br/>
            <br/>
            에니어그램은 자신과 타인을 이해하기 위한 참고 도구이며 결과는 <strong>절대적인 기준이나 진단</strong> 사용하지 않으시길 부탁드립니다.
          </p>

          <div class="actions actions--center">
            <button class="btn btn--primary btn--lg" id="btnStart" type="button">시작하기</button>
          </div>
        </div>
      </div>
    </div>
  `;

    $stage.innerHTML = html;

    const btn = document.getElementById("btnStart");
    if (btn) {
        btn.addEventListener("click", () => {
            step = 0;
            render();
            scrollTopSmooth();
        });
    }
}

function renderLikertBlock(q, selected) {
    const items = Array.from({ length: 5 }, (_, i) => {
        const v = i + 1;
        const sel = (Number(selected) === v) ? "selected" : "";
        return `
      <label class="likertItem ${sel}" data-qid="${q.id}" data-kind="likert" data-value="${v}">
        <input type="radio" name="q${q.id}" value="${v}" ${sel ? "checked" : ""}>
        <span class="likertDot" aria-hidden="true"></span>
        <span class="likertLabel">${escapeHtml(LIKERT_LABELS[i])}</span>
      </label>
    `;
    }).join("");

    return `
    <div class="likert" id="block">
      <div class="likertLine" aria-hidden="true"></div>
      ${items}
    </div>
  `;
}

function renderSingleBlock(q, selected) {
    // Q20: radio list
    if (q.id === 20) {
        const items = q.options
            .map((opt) => {
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
            })
            .join("");

        return `<div class="radioList" id="block">${items}</div>`;
    }

    // default grid
    const opts = q.options
        .map((opt) => {
            const sel = Number(selected) === Number(opt.type) ? "selected" : "";
            return `
        <div class="singleOpt ${sel}" data-qid="${q.id}" data-kind="single" data-value="${opt.type}">
          <div class="singleOpt__top">${escapeHtml(opt.label)}</div>
          <div class="singleOpt__sub">${escapeHtml(opt.desc ?? "")}</div>
        </div>
      `;
        })
        .join("");

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

        // save
        answers[qid] = value;

        // UI selected
        [...block.querySelectorAll(".selected")].forEach((x) => x.classList.remove("selected"));
        el.classList.add("selected");

        // for likert: keep radio checked for accessibility
        if (kind === "likert") {
            const input = el.querySelector("input[type=radio]");
            if (input) input.checked = true;
        }

        hideError();
    });
}

function goPrev() {
    if (step > 0) {
        step -= 1;
        render();
        scrollTopSmooth();
    }
}

function goNext(q) {
    const v = answers[q.id];
    if (v == null) {
        showError("응답을 선택해 주세요.");
        return;
    }

    if (step === QUESTIONS.length - 1) step = QUESTIONS.length;
    else step += 1;

    render();
    scrollTopSmooth();
}

function bindNavEvents(q) {
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");

    btnPrev?.addEventListener("click", goPrev);
    btnNext?.addEventListener("click", () => goNext(q));

    // keyboard UX
    window.onkeydown = (ev) => {
        if (step === QUESTIONS.length) return; // result page 제외

        if (ev.key === "ArrowLeft") {
            goPrev();
            return;
        }

        if (ev.key === "ArrowRight" || ev.key === "Enter") {
            goNext(q);
            return;
        }

        // likert 1~5 shortcut
        if (q.kind === "likert") {
            const n = Number(ev.key);
            if (n >= 1 && n <= 5) {
                answers[q.id] = n;
                render(); // selected 표시를 위해 재렌더
            }
        }
    };
}

// ---------------- result page ----------------
function renderResultPage() {
    const res = calcScores(QUESTIONS, answers);

    if (!res.ok) {
        // 안전장치
        step = 0;
        render();
        return;
    }

    const top3 = res.sorted
        .slice(0, 3)
        .map((x) => `${x.type}유형 ${x.pct}%`)
        .join(" · ");

    const info = TYPE_INFO[res.main];
    const wingInfo = TYPE_INFO[res.wing];

    // ✅ 새 CSS(.bar__track/.bar__fill)에 맞춘 막대
    const barsHtml = Array.from({ length: 9 }, (_, i) => {
        const t = i + 1;
        const pct = res.percent[t];
        return `
      <div class="bar">
        <div class="bar__top">
          <span>${t}유형</span>
          <span>${pct}%</span>
        </div>
        <div class="bar__track">
          <div class="bar__fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
    }).join("");

    const html = `
    <div class="backScreen">
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
              <h3>${res.main}유형: ${escapeHtml(info.name)} <span style="color:var(--muted);font-weight:800;">(날개: ${res.main}w${res.wing} — ${escapeHtml(wingInfo.name)})</span></h3>
    
              <div class="hr"></div>
              <b>강점(공동체에 주는 유익)</b>
              <ul>${info.strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
    
              <div class="hr"></div>
              <b>주의(흔한 함정)</b>
              <ul>${info.blindspots.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
    
              <div class="hr"></div>
              <b>성장 포인트(실천 제안)</b>
              <ul>${info.growth.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
    
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
    </div>
  `;

    $stage.innerHTML = html;

    document.getElementById("btnRestart")?.addEventListener("click", resetAll);
    document.getElementById("btnBackToLast")?.addEventListener("click", () => {
        step = QUESTIONS.length - 1;
        render();
        scrollTopSmooth();
    });

    // 결과 페이지에서는 키보드 핸들러 제거
    window.onkeydown = null;
}

// ---------------- actions ----------------
function resetAll() {
    for (const k of Object.keys(answers)) delete answers[k];
    step = -1;
    render();
    scrollTopSmooth();
}

$btnStartOver?.addEventListener("click", resetAll);

// 모바일 높이 계산 대응
function syncAppHeight() {
    const h = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty("--appH", `${h}px`);
}

// init
syncAppHeight();
window.addEventListener("resize", syncAppHeight);
window.visualViewport?.addEventListener("resize", syncAppHeight);
window.visualViewport?.addEventListener("scroll", syncAppHeight);
render();
