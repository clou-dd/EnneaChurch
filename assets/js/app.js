import { QUESTIONS, LIKERT_LABELS } from "./questions.js";
import { TYPE_INFO } from "./interpretations.js";
import { calcScores } from "./scoring.js";

const $questions = document.getElementById("questions");
const $msg = document.getElementById("msg");
const $result = document.getElementById("result");
const $topline = document.getElementById("topline");
const $bars = document.getElementById("bars");
const $typeDetail = document.getElementById("typeDetail");

const answers = {}; // qid -> likert(1~5) or single(type)

// ---------- utils ----------
function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function typeLabel(t) {
    return `${t}유형`;
}

// ---------- render ----------
function renderLikert(q) {
    const wrap = document.createElement("section");
    wrap.className = "card";
    wrap.innerHTML = `
    <p class="q-title">Q${q.id}</p>
    <p class="q-text">${escapeHtml(q.text)}</p>
    <div class="scale" id="q${q.id}"></div>
  `;
    const scale = wrap.querySelector(`#q${q.id}`);

    for (let i = 1; i <= 5; i++) {
        const label = document.createElement("label");
        label.className = "opt";
        label.innerHTML = `
      <input type="radio" name="q${q.id}" value="${i}">
      <div>${i}</div>
      <div class="muted" style="font-size:11px;">${escapeHtml(LIKERT_LABELS[i-1])}</div>
    `;
        label.addEventListener("click", () => {
            answers[q.id] = i;
            [...scale.querySelectorAll(".opt")].forEach(el => el.classList.remove("selected"));
            label.classList.add("selected");
        });
        scale.appendChild(label);
    }

    return wrap;
}

function renderSingle(q) {
    const wrap = document.createElement("section");
    wrap.className = "card";
    wrap.innerHTML = `
    <p class="q-title">Q${q.id}</p>
    <p class="q-text">${escapeHtml(q.text)}</p>
    <div class="scale" id="q${q.id}" style="grid-template-columns: repeat(2, 1fr);"></div>
    <p class="note muted">※ 하나만 선택</p>
  `;
    const scale = wrap.querySelector(`#q${q.id}`);

    q.options.forEach(opt => {
        const label = document.createElement("label");
        label.className = "opt";
        label.innerHTML = `
      <input type="radio" name="q${q.id}" value="${opt.type}">
      <div style="font-weight:800;">${escapeHtml(opt.label)}</div>
      <div class="muted" style="font-size:11px;">${escapeHtml(typeLabel(opt.type))}</div>
    `;
        label.addEventListener("click", () => {
            answers[q.id] = opt.type;
            [...scale.querySelectorAll(".opt")].forEach(el => el.classList.remove("selected"));
            label.classList.add("selected");
        });
        scale.appendChild(label);
    });

    return wrap;
}

function renderAll() {
    $questions.innerHTML = "";
    for (const q of QUESTIONS) {
        $questions.appendChild(q.kind === "likert" ? renderLikert(q) : renderSingle(q));
    }
}

renderAll();

// ---------- result render ----------
function renderResult(res) {
    $result.style.display = "block";

    const top3 = res.sorted.slice(0, 3).map(x => `${x.type}유형 ${x.pct}%`).join(" · ");
    $topline.innerHTML = `
    <span class="pill"><b>주유형</b> ${res.main}유형</span>
    <span class="pill"><b>윙</b> ${res.main}w${res.wing}</span>
    <span class="pill"><b>Top3</b> ${escapeHtml(top3)}</span>
  `;

    $bars.innerHTML = "";
    for (let t = 1; t <= 9; t++) {
        const row = document.createElement("div");
        row.className = "bar-row";
        row.innerHTML = `
      <div style="font-weight:800;">${t}</div>
      <div class="bar"><div style="width:${res.percent[t]}%"></div></div>
      <div style="text-align:right; font-weight:800;">${res.percent[t]}%</div>
    `;
        $bars.appendChild(row);
    }

    const info = TYPE_INFO[res.main];
    const wingInfo = TYPE_INFO[res.wing];

    $typeDetail.innerHTML = `
    <h3>${res.main}유형: ${escapeHtml(info.name)} <span class="muted">(윙: ${res.main}w${res.wing} — ${escapeHtml(wingInfo.name)})</span></h3>
    <div class="muted">※ 아래는 교회 공동체 상황에서 자주 나타나는 경향을 “설명”한 것이며, 정답/오답이 아닙니다.</div>

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
    <b>윙 힌트</b>
    <div class="muted">
      <b>${res.main}w${res.wing}</b>는 기본 성향(${res.main}) 위에 인접 유형(${res.wing})의 색이 얹혀 나타날 수 있습니다.
      말투/결정 속도/관계 방식에서 ${res.wing}유형의 특징이 더 도드라질 때가 있습니다.
    </div>
  `;
}

// ---------- events ----------
document.getElementById("btnCalc").addEventListener("click", () => {
    $msg.textContent = "";
    const res = calcScores(QUESTIONS, answers);

    if (!res.ok) {
        $result.style.display = "none";
        $msg.innerHTML = `<span class="warn">미응답 문항: ${res.missing.join(", ")}번</span> — 모두 응답 후 결과를 확인할 수 있습니다.`;
        return;
    }

    renderResult(res);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
});

document.getElementById("btnReset").addEventListener("click", () => {
    for (const k of Object.keys(answers)) delete answers[k];
    renderAll();
    $result.style.display = "none";
    $msg.textContent = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
});
