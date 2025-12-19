import { QUESTIONS, LIKERT_LABELS } from "./questions.js";
import { TYPE_INFO } from "./interpretations.js";
import { calcScores } from "./scoring.js";
import { ENNEAGRAM_CARDS } from "./resultCard.js";
import { encodePercentsToPb, decodePbToPercents } from "./shareCodec.js";

const $stage = document.getElementById("stage");
const $progressBar = document.getElementById("progressBar");
const $btnStartOver = document.getElementById("btnStartOver");

const answers = {}; // qid -> likert(1~5) or single(type)
let step = -1; // -1: start, 0..QUESTIONS.length-1: questions, QUESTIONS.length: result

// URL 결과 딥링크로 들어온 경우 강제로 사용할 결과
let forcedRes = null;

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

// ---------------- URL result deep link ----------------
function getResultKeyFromUrl() {
	const sp = new URLSearchParams(window.location.search);
	const raw = (sp.get("r") || "").trim().toLowerCase(); // e.g. "1w9"
	if (!/^[1-9]w[1-9]$/.test(raw)) return null;
	
	const main = parseInt(raw[0], 10);
	const wing = parseInt(raw[2], 10);
	
	// wing validation: adjacent only (1:9/2, 9:8/1, else ±1)
	const ok =
		(main === 1 && (wing === 9 || wing === 2)) ||
		(main === 9 && (wing === 8 || wing === 1)) ||
		(main >= 2 && main <= 8 && (wing === main - 1 || wing === main + 1));
	
	return ok ? `${main}w${wing}` : null;
}

/**
 * URL 점수 파라미터 파싱(base64 암호화 적용)
 */
function parsePercentParamFromUrl() {
	const sp = new URLSearchParams(window.location.search);
	const pb = (sp.get("pb") || "").trim();
	if (!pb) return null;
	return decodePbToPercents(pb); // length 9 or null
}

function makeResFromKeyOnly(key) {
	const main = parseInt(key[0], 10);
	const wing = parseInt(key[2], 10);
	
	// 점수 없는 결과: bars/top3 숨김 용도
	return {
		ok: true,
		main,
		wing,
		hasScores: false,
		percent: null,
		sorted: null
	};
}

function makeResFromKeyAndPercent(key, percentList) {
	const main = parseInt(key[0], 10);
	const wing = parseInt(key[2], 10);
	
	// percentList: length 9, index 0->type1 ... index8->type9
	const percent = {};
	for (let t = 1; t <= 9; t++) {
		percent[t] = percentList[t - 1];
	}
	
	const sorted = Array.from({ length: 9 }, (_, i) => {
		const type = i + 1;
		return { type, pct: percent[type] };
	}).sort((a, b) => b.pct - a.pct || a.type - b.type);
	
	return {
		ok: true,
		main,
		wing,
		hasScores: true,
		percent,
		sorted
	};
}

/**
 * index.html 제거한 "공유용 base URL" 만들기
 * - /index.html -> /
 * - 그 외는 pathname 유지
 */
function normalizeSharePath(urlObj) {
	const INDEX = "/index.html";
	if (urlObj.pathname.endsWith(INDEX)) {
		urlObj.pathname = urlObj.pathname.slice(0, -("index.html".length));
		// 끝이 ""이면 "/"로 보정
		if (urlObj.pathname === "") urlObj.pathname = "/";
	}
}

/**
 * 공유/딥링크용 URL 구성
 * - r 필수
 * - hasScores=true면 p=9개 점수 포함
 */
function buildResultUrl(res) {
	const url = new URL(window.location.href);
	normalizeSharePath(url);
	
	url.searchParams.set("r", `${res.main}w${res.wing}`);
	
	if (res.hasScores === true && res.percent) {
		const percentList9 = Array.from({ length: 9 }, (_, i) => {
			const t = i + 1;
			return res.percent[t];
		});
		
		const pb = encodePercentsToPb(percentList9);
		if (pb) url.searchParams.set("pb", pb);
		else url.searchParams.delete("pb");
	} else {
		url.searchParams.delete("pb");
	}
	
	return url.toString();
}

function bootByUrlResultIfAny() {
	const key = getResultKeyFromUrl();
	if (!key) return false;
	
	const pList = parsePercentParamFromUrl();
	
	if (pList) {
		forcedRes = makeResFromKeyAndPercent(key, pList);
	} else {
		forcedRes = makeResFromKeyOnly(key);
	}
	
	step = QUESTIONS.length; // 결과 페이지로 바로 이동
	return true;
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

function bindQuestionEvents() {
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
	// ✅ URL 딥링크로 들어온 경우 forcedRes를 우선 사용
	const baseRes = forcedRes || calcScores(QUESTIONS, answers);
	
	if (!baseRes || !baseRes.ok) {
		// 안전장치
		step = 0;
		forcedRes = null;
		render();
		return;
	}
	
	// calcScores 결과에는 hasScores가 없을 수 있으니 기본 true로 취급
	const res = {
		...baseRes,
		hasScores: (baseRes.hasScores !== false)
	};
	
	const info = TYPE_INFO[res.main];
	const wingInfo = TYPE_INFO[res.wing];
	
	// ✅ 점수/Top3/막대는 "실제 점수 있을 때만" 표시
	let top3Html = "";
	let scoreBlockHtml = "";
	
	if (res.hasScores === true && res.percent && res.sorted) {
		const top3 = res.sorted
			.slice(0, 3)
			.map((x) => `${x.type}유형 ${x.pct}%`)
			.join(" · ");
		
		top3Html = `
      <div class="badgeRow">
        <span class="badge badge--accent">Top3: ${escapeHtml(top3)}</span>
        <span class="badge">요약: ${escapeHtml(info.name)}</span>
      </div>
    `;
		
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
		
		scoreBlockHtml = `
      <p class="hint">
        아래 점수는 “유형 가능성”을 보여줍니다. 상황(스트레스/회복/역할)에 따라 달라질 수 있습니다.
      </p>
      <div class="bars">${barsHtml}</div>
    `;
	} else {
		// 점수 없는 딥링크는 가짜 표시 제거 + 요약 배지 단독 노출
		top3Html = `
      <div class="badgeRow">
        <span class="badge">요약: ${escapeHtml(info.name)}</span>
      </div>
    `;
	}
	
	const downloadCardHtml = renderDownloadCardSection(res);
	
	const html = `
    <div class="backScreen">
        ${downloadCardHtml}

        <div class="card fadeIn">
          <div class="card__header">
            <div class="kicker">결과</div>
            <h2 class="title">당신은 ${res.main}번 유형 · ${res.wing}번 날개(${res.main}w${res.wing})</h2>
            ${top3Html}
          </div>

          <div class="card__body">
            ${scoreBlockHtml}

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
		forcedRes = null;
		render();
		scrollTopSmooth();
	});
	
	bindDownloadCardEvents(res);
	bindShareCardEvents(res);
	
	// 결과 페이지에서는 키보드 핸들러 제거
	window.onkeydown = null;
}

// ---------------- actions ----------------
function resetAll() {
	for (const k of Object.keys(answers)) delete answers[k];
	step = -1;
	forcedRes = null;
	
	// URL에 r/p 파라미터 남아 있으면 초기화가 결과로 다시 갈 수 있으니 제거
	try {
		const url = new URL(window.location.href);
		normalizeSharePath(url);
		url.searchParams.delete("r");
		url.searchParams.delete("pb");
		window.history.replaceState({}, "", url.toString());
	} catch (_) {}
	
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

/**
 * 최상단 "이미지 다운로드용 카드" 섹션 HTML
 */
function renderDownloadCardSection(res) {
	const key = `${res.main}w${res.wing}`;
	const card = ENNEAGRAM_CARDS[key];
	
	const title = card?.title ?? "결과 카드";
	const summary = card?.summary ?? "";
	const description = card?.description ?? "";
	const bibleChars = (card?.bibleCharacters ?? []).join(", ");
	const fruit = card?.fruitOfSpirit ?? "";
	
	return `
    <section class="dlCardSection">
      <div class="dlCardSection__head"></div>

      <div class="dlCardWrap">
        <div class="dlCard" id="resultDownloadCard" data-type="${key}">
          <div class="dlCard__top">
            <div class="dlCard__type">${key}</div>
            <div class="dlCard__title">${escapeHtml(title)}</div>
          </div>

          <div class="dlCard__mid">
            ${summary ? `<div class="dlCard__summary">${escapeHtml(summary)}</div>` : ""}
            ${description ? `<div class="dlCard__desc">${escapeHtml(description)}</div>` : ""}
          </div>

          <div class="dlCard__bottom">
            <div class="dlCard__meta">
              <div class="dlCard__label">성경 인물</div>
              <div class="dlCard__value">${escapeHtml(bibleChars || "-")}</div>
            </div>
            <div class="dlCard__meta">
              <div class="dlCard__label">성령의 열매</div>
              <div class="dlCard__value">${escapeHtml(fruit || "-")}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="dlCardSection__actions" style="margin-top: 10px; margin-bottom: 10px;">
          <button type="button" class="btn btn--ghost" id="btnShareCard">
            공유하기
          </button>
	      <button type="button" class="btn btn--ghost" id="btnDownloadCardPng">
	        이미지 저장(PNG)
	      </button>
	  </div>
    </section>
  `;
}

/**
 * 다운로드 버튼 이벤트 바인딩
 * - 오버레이 미리보기로 띄우고, 길게 눌러 저장 유도 (iOS 인앱 안정)
 */
function bindDownloadCardEvents() {
	const btn = document.getElementById("btnDownloadCardPng");
	const cardEl = document.getElementById("resultDownloadCard");
	if (!btn || !cardEl) return;
	
	btn.addEventListener("click", async () => {
		try {
			btn.disabled = true;
			btn.textContent = "이미지 생성 중…";
			
			const blob = await captureCardToBlob(cardEl);
			showImagePreviewFromBlob(blob);
			
			alert("이미지 위를 길게 눌러 ‘사진에 저장’ 또는 ‘공유’를 선택하세요.");
		} catch (e) {
			console.error(e);
			alert("이미지 생성에 실패했습니다. (외부 이미지/폰트가 있으면 CORS 문제일 수 있습니다)");
		} finally {
			btn.disabled = false;
			btn.textContent = "이미지 저장(PNG)";
		}
	});
}

async function captureCardToBlob(cardEl) {
	if (typeof html2canvas !== "function") {
		throw new Error("html2canvas_missing");
	}
	
	if (document.fonts && document.fonts.ready) {
		try { await document.fonts.ready; } catch (_) {}
	}
	
	const canvas = await html2canvas(cardEl, {
		backgroundColor: "#ffffff",
		scale: Math.max(2, window.devicePixelRatio || 2),
		useCORS: true,
		allowTaint: false
	});
	
	const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
	if (!blob) throw new Error("toBlob_failed");
	return blob;
}

function bindShareCardEvents(res) {
	const btn = document.getElementById("btnShareCard");
	const cardEl = document.getElementById("resultDownloadCard");
	if (!btn || !cardEl) return;
	
	const key = `${res.main}w${res.wing}`;
	const shareTitle = `에니어그램 결과 ${key}`;
	
	const shareText = [
		"나의 에니어그램 결과",
		`${key}`,
		"",
		"교회 에니어그램 테스트"
	].join("\n");
	
	// ✅ 결과 + (가능하면) 점수까지 포함한 URL 공유
	const shareUrl = buildResultUrl(res);
	
	btn.addEventListener("click", async () => {
		try {
			btn.disabled = true;
			btn.textContent = "공유 준비 중…";
			
			const blob = await captureCardToBlob(cardEl);
			
			// 1) 가능하면 파일 공유 (이미지)
			if (navigator.share) {
				try {
					const file = new File([blob], `enneagram-${key}.png`, { type: "image/png" });
					const canFileShare = typeof navigator.canShare === "function"
						? navigator.canShare({ files: [file] })
						: true;
					
					if (canFileShare) {
						// iOS에서는 files 공유 시 url이 무시될 수 있어(앱마다 다름)
						// -> URL 공유도 중요하니 text에 shareUrl을 같이 넣어줌
						await navigator.share({
							title: shareTitle,
							text: `${shareText}\n\n${shareUrl}`,
							files: [file]
						});
						return;
					}
				} catch (e) {
					console.warn("file share failed, fallback:", e);
				}
				
				// 2) URL 공유
				try {
					await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
					return;
				} catch (e) {
					console.warn("url share failed, fallback:", e);
				}
			}
			
			// 3) 마지막: 오버레이로 띄워서 길게 눌러 공유/저장 유도
			showImagePreviewFromBlob(blob);
			alert(`공유가 제한되어 이미지 미리보기를 열었습니다.\n\n링크:\n${shareUrl}`);
		} catch (e) {
			console.error(e);
			alert("공유에 실패했습니다. (인앱 브라우저 제한 또는 CORS 문제 가능)");
		} finally {
			btn.disabled = false;
			btn.textContent = "공유하기";
		}
	});
}

function ensureImagePreviewOverlay() {
	if (document.getElementById("imgPreviewOverlay")) return;
	
	const wrap = document.createElement("div");
	wrap.id = "imgPreviewOverlay";
	wrap.style.cssText = `
    position:fixed; inset:0; z-index:9999;
    display:none; align-items:center; justify-content:center;
    background:rgba(0,0,0,.55); padding:16px;
  `;
	
	wrap.innerHTML = `
    <div style="
      width:min(520px, 100%);
      background:#fff; border-radius:18px; padding:14px;
      box-shadow:0 18px 40px rgba(0,0,0,.25);
      ">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <div style="font-weight:900; font-size:14px; color:#0f172a;">이미지 미리보기</div>
        <button type="button" id="btnCloseImgPreview"
          style="border:0; background:transparent; font-size:18px; padding:6px 8px; cursor:pointer;">✕</button>
      </div>

      <div style="margin-top:10px;">
        <img id="imgPreviewEl" alt="result card"
          style="width:100%; height:auto; display:block; border-radius:14px; border:1px solid rgba(15,23,42,.10);"  src=""/>
      </div>

      <div style="margin-top:10px; font-size:12px; color:#475569; line-height:1.4;">
        이미지를 길게 눌러 “사진에 저장” 또는 “공유”를 선택하세요.
      </div>
    </div>
  `;
	
	document.body.appendChild(wrap);
	
	wrap.addEventListener("click", (e) => {
		if (e.target === wrap) wrap.style.display = "none";
	});
	
	document.getElementById("btnCloseImgPreview").addEventListener("click", () => {
		wrap.style.display = "none";
	});
}

function showImagePreviewFromBlob(blob) {
	ensureImagePreviewOverlay();
	const overlay = document.getElementById("imgPreviewOverlay");
	const img = document.getElementById("imgPreviewEl");
	
	const url = URL.createObjectURL(blob);
	img.src = url;
	overlay.style.display = "flex";
	
	setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ---------------- start ----------------
bootByUrlResultIfAny();
render();
