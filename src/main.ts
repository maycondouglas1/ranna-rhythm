import { Sound } from "./audio";
import {
  APPROACH,
  makeChart,
  Round,
  TRACKS,
  type Difficulty,
  type Grade,
} from "./rhythm";
import type { Stage } from "./stage";
import "./style.css";

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const symbols = ["♡", "✦", "☾", "♬"];
const colors = ["#f59bbc", "#e7c267", "#aa9aea", "#79cdc2"];
const difficultyNames = {
  easy: "Izi",
  normal: "Balanceado",
  hard: "Super Ranna",
};
type RecordEntry = {
  score: number;
  accuracy: number;
  combo: number;
  rank: string;
};
type Saved = {
  volume: number;
  offset: number;
  reduced: boolean;
  records: Record<string, RecordEntry>;
};
const saved: Saved = {
  volume: 0.7,
  offset: 0,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  records: {},
};
try {
  const data = JSON.parse(localStorage.getItem("ranna-rhythm-v1") || "{}");
  if (typeof data.volume === "number" && data.volume >= 0 && data.volume <= 1)
    saved.volume = data.volume;
  if (typeof data.offset === "number" && Math.abs(data.offset) <= 300)
    saved.offset = data.offset;
  if (typeof data.reduced === "boolean") saved.reduced = data.reduced;
  if (data.records && typeof data.records === "object")
    for (const [key, value] of Object.entries(data.records)) {
      const record = value as RecordEntry;
      if (
        record &&
        Number.isFinite(record.score) &&
        Number.isFinite(record.accuracy) &&
        Number.isFinite(record.combo) &&
        ["S", "A", "B", "C"].includes(record.rank)
      )
        saved.records[key] = record;
    }
} catch {
  /* Storage is optional, including in private browsing. */
}
function persist() {
  try {
    localStorage.setItem("ranna-rhythm-v1", JSON.stringify(saved));
  } catch {
    $("#save-note").textContent = "Recordes disponíveis só nesta sessão.";
  }
}

$("#app").innerHTML = `
  <main class="layout">
    <section class="console-wrap" aria-label="Console do jogo">
      <div class="console">
        <div class="console-top">
          <header class="hardware-top"><h1 class="wordmark">ranna<span>rhythm</span></h1><span class="power-light" aria-label="Console ligado"></span><button class="icon-button" id="settings" aria-label="Abrir configurações">⚙</button></header>
          <div class="top-screen">
            <canvas id="stage" aria-label="Ranna, Maycon e Cebolinha em um jardim musical"></canvas>
            <div class="stage-fallback" aria-hidden="true"><img src="/art/ranna.webp" alt=""><img src="/art/maycon.webp" alt=""><img src="/art/cebolinha.webp" alt=""></div>
            <div class="stage-hud"><span class="live-badge"><i></i> JARDIM DA LUA</span><span id="stage-stars">✦ ✦ ✦</span></div>
            <div class="stage-title" id="stage-title"><span id="selected-subtitle">O show do Cebolinha</span></div>
            
          </div>
          
        </div>
        <div class="hinge" aria-hidden="true"><i></i><i></i></div>
        <div class="console-bottom">
          <div class="bottom-screen">
            <section id="menu" class="screen-menu">
              <div class="screen-bar"><h2>Escolha a música</h2><span>01 / 03</span></div>
              <div class="track-list" role="group" aria-label="Escolha uma música">${TRACKS.map((track, i) => `<button class="track" data-track="${i}" aria-pressed="${i === 0}" style="--track-color:${track.color}"><span class="track-number" aria-hidden="true">0${i + 1}</span><span class="track-copy"><strong>${track.title}</strong><small>${track.bpm} BPM · 1:30</small></span><span class="track-arrow" aria-hidden="true">▶</span></button>`).join("")}</div>
              <div class="difficulty-label">Dificuldade</div>
              <div class="difficulty" role="group" aria-label="Dificuldade">${Object.entries(
                difficultyNames,
              )
                .map(
                  ([key, name]) =>
                    `<button data-difficulty="${key}" aria-pressed="${key === "normal"}"><span>${key === "easy" ? "✦" : key === "normal" ? "✦✦" : "✦✦✦"}</span>${name}</button>`,
                )
                .join("")}</div>
              <button id="play" class="play-button"><span aria-hidden="true">▶</span> Jogar</button>
              <div class="best-line"><span id="best">Ainda sem recorde</span><button class="text-button" id="how-to">Como jogar?</button></div>
              <p id="load-status" role="status"></p>
            </section>
            <section id="game" class="game-screen" hidden aria-label="Pistas de ritmo">
              <div class="game-hud"><div><small>PONTOS</small><strong id="score">000000</strong></div><div class="combo"><strong id="combo">0</strong><small>COMBO</small></div><button id="pause" aria-label="Pausar jogo">Ⅱ</button></div>
              <div class="highway"><canvas id="notes" aria-label="Aperte os quatro botões quando as notas chegarem à linha"></canvas><div id="judgment" aria-hidden="true"></div><div id="countdown" aria-live="polite"></div></div>
              <div class="pads" role="group" aria-label="Controles de ritmo">${symbols.map((s, i) => `<button class="pad" data-lane="${i}" style="--lane:${colors[i]}" aria-label="Pista ${i + 1}, tecla ${["D", "F", "J", "K"][i]}"><span>${s}</span><kbd>${["D", "F", "J", "K"][i]}</kbd></button>`).join("")}</div>
              <div class="song-progress"><div id="progress"></div></div>
            </section>
            <section id="result" class="result-screen" hidden>
              <span class="eyebrow">SHOW CONCLUÍDO!</span><div class="result-main"><strong id="rank">S</strong><div><h2 id="result-title">Você brilhou!</h2><p id="result-message"></p></div></div>
              <div class="result-stats"><div><strong id="result-score"></strong><small>PONTOS</small></div><div><strong id="result-accuracy"></strong><small>PRECISÃO</small></div><div><strong id="result-combo"></strong><small>MAIOR COMBO</small></div></div>
              <p id="result-counts"></p><div class="result-actions"><button id="replay" class="play-button">↻ Mais uma vez</button><button id="back" class="secondary-button">Músicas</button></div>
            </section>
          </div>
          <nav class="hardware-bottom" aria-label="Extras"><button id="album">Nosso álbum</button><span class="console-model" aria-hidden="true">RR–01</span><button id="credits">Créditos</button></nav>
        </div>
      </div>
      <p class="controls-hint"><span><kbd>D</kbd> <kbd>F</kbd> <kbd>J</kbd> <kbd>K</kbd> no teclado</span><span>ou toque nas quatro pistas</span></p>
      <p id="save-note" role="status"></p>
    </section>
  </main>
  <dialog id="dialog"><button class="dialog-close" aria-label="Fechar">×</button><div id="dialog-content"></div></dialog>
`;

let selected = 0;
let difficulty: Difficulty = "normal";
let mode: "menu" | "loading" | "playing" | "paused" | "result" = "menu";
let round: Round | undefined;
let loading: AbortController | undefined;
let stage: Stage | undefined;
const sound = new Sound();
sound.volume = saved.volume;
void import("./stage")
  .then(({ Stage }) => {
    stage = new Stage($("#stage"));
    stage.reduced = saved.reduced;
  })
  .catch(() => $(".top-screen").classList.add("art-fallback"));
const dialog = $<HTMLDialogElement>("#dialog");
const noteCanvas = $<HTMLCanvasElement>("#notes");
const ctx = noteCanvas.getContext("2d")!;
const pads = [...document.querySelectorAll<HTMLButtonElement>(".pad")];
const flashes = [0, 0, 0, 0];
let judgmentUntil = 0;
let width = 400,
  height = 140;
let lastBeat = -999;

new ResizeObserver(() => {
  const rect = noteCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  width = rect.width;
  height = rect.height;
  const ratio = Math.min(devicePixelRatio, 2);
  noteCanvas.width = Math.round(width * ratio);
  noteCanvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}).observe(noteCanvas);

function refreshSelection() {
  const track = TRACKS[selected];
  $("#selected-subtitle").textContent = track.subtitle;
  $(".screen-bar > span").textContent = `0${selected + 1} / 03`;
  const best = saved.records[`${track.id}-${difficulty}`];
  $("#best").textContent = best
    ? `RECORDE ${best.score.toLocaleString("pt-BR")} · ${best.rank}`
    : "Ainda sem recorde";
  document
    .querySelectorAll<HTMLButtonElement>("[data-track]")
    .forEach((button, i) => {
      button.setAttribute("aria-pressed", String(i === selected));
      button.disabled =
        mode === "playing" || mode === "paused" || mode === "loading";
    });
  document
    .querySelectorAll("[data-difficulty]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String((button as HTMLElement).dataset.difficulty === difficulty),
      ),
    );
}

function showScreen(screen: "menu" | "game" | "result") {
  for (const name of ["menu", "game", "result"])
    $(`#${name}`).hidden = name !== screen;
  document.body.classList.toggle("in-game", screen === "game");
  $("#stage-title").hidden = screen === "game";
}

function updateHud() {
  if (!round) return;
  $("#score").textContent = String(round.score).padStart(6, "0");
  $("#combo").textContent = String(round.combo);
  $("#stage-stars").textContent =
    round.combo >= 30 ? "★ ★ ★" : round.combo >= 10 ? "★ ★ ☆" : "★ ☆ ☆";
}

async function start() {
  if (mode === "loading" || mode === "playing") return;
  loading?.abort();
  loading = new AbortController();
  const controller = loading;
  mode = "loading";
  showScreen("menu");
  refreshSelection();
  $<HTMLButtonElement>("#play").disabled = true;
  $("#load-status").textContent = "Afinando os instrumentos…";
  try {
    await sound.unlock();
    await sound.load(TRACKS[selected].file, controller.signal);
    controller.signal.throwIfAborted();
    round = new Round(makeChart(TRACKS[selected], difficulty));
    lastBeat = -999;
    sound.play();
    mode = "playing";
    $("#load-status").textContent = "";
    $("#judgment").textContent = "";
    showScreen("game");
    updateHud();
    refreshSelection();
    $("#pause").focus({ preventScroll: true });
    if (document.hidden) pause();
  } catch (error) {
    if (controller.signal.aborted) return;
    mode = "menu";
    refreshSelection();
    $("#load-status").textContent =
      error instanceof Error
        ? error.message
        : "Não foi possível iniciar o áudio.";
  } finally {
    if (loading === controller) $<HTMLButtonElement>("#play").disabled = false;
  }
}

function feedback(grade: Grade, lane?: number) {
  const label = {
    perfect: "PERFEITO! ✦",
    good: "MANDOU BEM!",
    ok: "QUASE LÁ!",
    miss: "CONTINUA ♡",
  }[grade];
  $("#judgment").textContent = label;
  $("#judgment").dataset.grade = grade;
  judgmentUntil = performance.now() + 500;
  if (grade !== "miss" && lane !== undefined) {
    sound.tick(lane, grade === "perfect");
    flashes[lane] = performance.now();
    if (grade === "perfect") stage?.celebrate();
  }
  updateHud();
}

function hit(lane: number) {
  if (mode !== "playing" || dialog.open || !round) return;
  const time = sound.time - saved.offset / 1000;
  if (time < 0) return;
  const grade = round.hit(lane, time);
  if (grade) feedback(grade, lane);
  pads[lane].classList.add("pressed");
}

function openDialog(content: string) {
  $("#dialog-content").innerHTML = content;
  if (!dialog.open) dialog.showModal();
}

function pause() {
  if (mode !== "playing") return;
  sound.pause();
  mode = "paused";
  pads.forEach((pad) => pad.classList.remove("pressed"));
  openDialog(
    `<span class="eyebrow">PAUSA</span><h2>Já voltamos.</h2><p>Cebolinha está cuidando dos instrumentos.</p><button class="play-button" id="resume">▶ Continuar</button><button class="secondary-button" id="quit">Voltar às músicas</button>`,
  );
  $("#resume").onclick = () => void resume();
  $("#quit").onclick = () => {
    sound.stop();
    mode = "menu";
    dialog.close();
    showScreen("menu");
    refreshSelection();
    $("#play").focus();
  };
}

async function resume() {
  if (mode !== "paused") return;
  try {
    await sound.resume();
    mode = "playing";
    dialog.close();
    $("#pause").focus({ preventScroll: true });
  } catch {
    $("#dialog-content p").textContent =
      "Toque em continuar para reativar o áudio.";
  }
}

function finish() {
  if (!round) return;
  round.expire(Infinity);
  sound.stop();
  mode = "result";
  const key = `${TRACKS[selected].id}-${difficulty}`;
  const isBest = !saved.records[key] || round.score > saved.records[key].score;
  if (isBest) {
    saved.records[key] = {
      score: round.score,
      accuracy: round.accuracy,
      rank: round.rank,
      combo: round.maxCombo,
    };
    persist();
  }
  $("#rank").textContent = round.rank;
  $("#result-title").textContent =
    round.accuracy >= 85 ? "Você brilhou, Ranna!" : "Mais um show nosso ♡";
  $("#result-message").textContent =
    round.counts.miss === 0
      ? "FULL COMBO! Cebolinha pediu bis."
      : isBest
        ? "Novo recorde! Maycon está aplaudindo."
        : "O melhor lugar é sempre ao seu lado.";
  $("#result-score").textContent = round.score.toLocaleString("pt-BR");
  $("#result-accuracy").textContent = `${round.accuracy.toFixed(1)}%`;
  $("#result-combo").textContent = String(round.maxCombo);
  $("#result-counts").textContent =
    `${round.counts.perfect} perfeitos · ${round.counts.good} bons · ${round.counts.ok} quase · ${round.counts.miss} passaram`;
  stage?.celebrate();
  showScreen("result");
  refreshSelection();
  $("#replay").focus({ preventScroll: true });
}

function renderNotes(time: number, now: number) {
  ctx.clearRect(0, 0, width, height);
  const laneWidth = width / 4;
  const target = height - 22;
  for (let lane = 0; lane < 4; lane++) {
    ctx.fillStyle = lane % 2 ? "#30253f" : "#352942";
    ctx.fillRect(lane * laneWidth, 0, laneWidth, height);
    const elapsed = now - flashes[lane];
    if (elapsed < 220) {
      ctx.fillStyle = `${colors[lane]}${Math.round((1 - elapsed / 220) * 65)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.fillRect(lane * laneWidth, 0, laneWidth, height);
    }
    ctx.strokeStyle = "#ffffff12";
    ctx.beginPath();
    ctx.moveTo(lane * laneWidth, 0);
    ctx.lineTo(lane * laneWidth, height);
    ctx.stroke();
    ctx.strokeStyle = colors[lane];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc((lane + 0.5) * laneWidth, target, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = "#fbddec88";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, target);
  ctx.lineTo(width, target);
  ctx.stroke();
  for (const note of round?.notes || []) {
    if (note.judged || note.time - time > APPROACH || note.time - time < -0.2)
      continue;
    const y = target - ((note.time - time) / APPROACH) * (target + 20);
    const x = (note.lane + 0.5) * laneWidth;
    ctx.fillStyle = colors[note.lane];
    ctx.beginPath();
    ctx.roundRect(x - 23, y - 12, 46, 24, 8);
    ctx.fill();
    ctx.strokeStyle = "#ffffffb0";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#382c4e";
    ctx.font = "bold 19px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(symbols[note.lane], x, y + 1);
  }
}

let lastFrame = 0;
function frame(now: number) {
  requestAnimationFrame(frame);
  if (document.hidden) return;
  const time = sound.time;
  if (now - lastFrame > 1000 / 30) {
    stage?.render(
      mode === "playing" ? Math.max(0, time) : (now / 1000) * 0.4,
      TRACKS[selected].bpm,
      mode === "playing",
    );
    lastFrame = now;
  }
  if (mode !== "playing" || !round) return;
  if (sound.interrupted) {
    pause();
    return;
  }
  const chartTime = time - saved.offset / 1000;
  if (round.expire(chartTime)) feedback("miss");
  renderNotes(chartTime, now);
  if (now > judgmentUntil) $("#judgment").textContent = "";
  const beat = Math.floor(time);
  if (beat !== lastBeat) {
    lastBeat = beat;
    $("#countdown").textContent =
      time < 0 ? String(Math.ceil(-time)) : time < 0.8 ? "VAI! ♡" : "";
  }
  $("#progress").style.width =
    `${(Math.max(0, time) / TRACKS[selected].duration) * 100}%`;
  if (time >= TRACKS[selected].duration + 0.3) finish();
}

document.querySelectorAll<HTMLButtonElement>("[data-track]").forEach(
  (button) =>
    (button.onclick = () => {
      selected = Number(button.dataset.track);
      mode = "menu";
      showScreen("menu");
      refreshSelection();
      stage?.celebrate();
    }),
);
document.querySelectorAll<HTMLButtonElement>("[data-difficulty]").forEach(
  (button) =>
    (button.onclick = () => {
      difficulty = button.dataset.difficulty as Difficulty;
      refreshSelection();
    }),
);
$("#play").onclick = () => void start();
$("#replay").onclick = () => void start();
$("#back").onclick = () => {
  mode = "menu";
  showScreen("menu");
  refreshSelection();
  $("#play").focus();
};
$("#pause").onclick = pause;
for (const [lane, pad] of pads.entries()) {
  pad.onpointerdown = (event) => {
    event.preventDefault();
    pad.setPointerCapture(event.pointerId);
    hit(lane);
  };
  pad.onpointerup =
    pad.onpointercancel =
    pad.onlostpointercapture =
      () => pad.classList.remove("pressed");
  pad.onclick = (event) => {
    if (event.detail === 0) {
      hit(lane);
      setTimeout(() => pad.classList.remove("pressed"), 100);
    }
  };
}
const keys = ["KeyD", "KeyF", "KeyJ", "KeyK"];
window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (event.code === "Escape" && !dialog.open && mode === "playing") {
    event.preventDefault();
    pause();
    return;
  }
  if (dialog.open || mode !== "playing") return;
  const lane = keys.indexOf(event.code);
  if (lane >= 0) {
    event.preventDefault();
    hit(lane);
  }
});
window.addEventListener("keyup", (event) => {
  const lane = keys.indexOf(event.code);
  if (lane >= 0) pads[lane].classList.remove("pressed");
});
window.addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
dialog.addEventListener("cancel", (event) => {
  if (mode === "paused") {
    event.preventDefault();
    void resume();
  }
});
$(".dialog-close").onclick = () =>
  mode === "paused" ? void resume() : dialog.close();

$("#how-to").onclick = () =>
  openDialog(
    `<span class="eyebrow">SEU PRIMEIRO SHOW</span><h2>É só sentir a música.</h2><ol class="instructions"><li>Escolha uma música e sua dificuldade. “Izi” tem menos notas para começar.</li><li>As notas descem em quatro pistas. Toque no botão correspondente quando a nota alcançar o círculo da linha.</li><li>No computador, use <b>D · F · J · K</b>. No celular, use os dois polegares nos quatro botões.</li><li>Acertos seguidos aumentam o combo. Você pode terminar o show mesmo errando.</li></ol><p>Som atrasado no Bluetooth? Ajuste a sincronização em ⚙. Comece com +100 ms.</p>`,
  );
$("#settings").onclick = () => {
  if (mode === "playing" || mode === "paused" || mode === "loading") {
    if (mode === "playing") pause();
    return;
  }
  openDialog(
    `<h2>Configurações</h2><label class="setting">Volume da música <input id="volume" type="range" min="0" max="100" value="${Math.round(saved.volume * 100)}"></label><label class="setting">Sincronização <output id="offset-value">${saved.offset} ms</output><input id="offset" type="range" min="-300" max="300" step="5" value="${saved.offset}"></label><p class="setting-help">Se você toca junto com a música e chega tarde nas notas, aumente o valor. Se chega cedo, diminua. Fones com fio costumam ter menos atraso.</p><label class="setting check"><input id="reduced" type="checkbox" ${saved.reduced ? "checked" : ""}> Reduzir movimento dos personagens</label><p>Os ajustes e recordes ficam salvos neste navegador.</p>`,
  );
  $<HTMLInputElement>("#volume").oninput = (event) => {
    saved.volume = Number((event.target as HTMLInputElement).value) / 100;
    sound.setVolume(saved.volume);
    persist();
  };
  $<HTMLInputElement>("#offset").oninput = (event) => {
    saved.offset = Number((event.target as HTMLInputElement).value);
    $("#offset-value").textContent = `${saved.offset} ms`;
    persist();
  };
  $<HTMLInputElement>("#reduced").onchange = (event) => {
    saved.reduced = (event.target as HTMLInputElement).checked;
    if (stage) stage.reduced = saved.reduced;
    persist();
  };
};

$("#album").onclick = () => {
  if (mode === "playing") {
    pause();
    return;
  }
  if (mode === "paused" || mode === "loading") return;
  const completed = TRACKS.filter((t) =>
    Object.keys(saved.records).some((key) => key.startsWith(`${t.id}-`)),
  ).length;
  openDialog(
    `<span class="eyebrow">NOSSO ÁLBUM · ${completed}/3 MÚSICAS JOGADAS</span><h2>A melhor banda é a nossa.</h2><div class="album-grid"><article><img src="/art/ranna.webp" alt="Ranna com vestido floral e microfone"><h3>Ranna</h3><p>A pessoa mais especial do meu mundo.</p></article><article><img src="/art/maycon.webp" alt="Maycon de óculos tocando keytar"><h3>Maycon</h3><p>Player 2, guitarrista e seu namorado que te ama muiito.</p></article><article><img src="/art/cebolinha.webp" alt="Cebolinha, gato branco e tigrado"><h3>Cebolinha</h3><p>Diretor de fofura. Recebe salário em sachê.</p></article></div><p class="album-message">Para a minha pitoquinha.<br>Com amor, Maycon. ♡</p>`,
  );
};
$("#credits").onclick = () => {
  if (mode === "playing") {
    pause();
    return;
  }
  if (mode === "paused" || mode === "loading") return;
  openDialog(
    `<span class="eyebrow">QUEM FAZ ESSE SHOW ACONTECER</span><h2>Feito com carinho e créditos.</h2><p>Para Ranna, com Maycon e Cebolinha. Arte chibi criada com IA a partir das referências fornecidas por Maycon.</p><h3>Músicas de Kevin MacLeod</h3><ul>${TRACKS.map((t) => `<li><a href="https://incompetech.com/music/royalty-free/index.html?isrc=${t.isrc}" target="_blank" rel="noopener noreferrer">${t.id === "pixel" ? "Pixel Peeker Polka - faster" : t.title}</a> — Kevin MacLeod (<a href="https://incompetech.com" target="_blank" rel="noopener noreferrer">incompetech.com</a>)</li>`).join("")}</ul><p>Licenciadas sob <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">Creative Commons Attribution 4.0</a>. Edições arcade de 90 segundos, com fade no final e conversão para MP3 160 kbps.</p><p>Inspirado no carinho dos jogos de ritmo portáteis. Projeto independente, sem vínculo com Nintendo, Hatsune Miku ou Michael Jackson.</p>`,
  );
};
refreshSelection();
requestAnimationFrame(frame);
window.addEventListener("pagehide", () => {
  loading?.abort();
  sound.stop();
});
