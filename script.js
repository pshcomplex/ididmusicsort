// ===== DOM =====
const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");
const sortScreen = document.getElementById("sortScreen");

const leftBtn = document.getElementById("left");
const rightBtn = document.getElementById("right");
const tieBtn = document.getElementById("tie");
const undoBtn = document.getElementById("undo");

const leftThumb = document.getElementById("leftThumb");
const rightThumb = document.getElementById("rightThumb");

const songContainer = document.getElementById("song-container");
const resultDiv = document.getElementById("result");

// aux row (모바일 전용 자리)
const auxRow = document.getElementById("auxRow");
const auxLeft = document.getElementById("auxLeft");
const auxRight = document.getElementById("auxRight");

// ===== STATE =====
let songs = [];
let mergeStack = [];
let leftList = [];
let rightList = [];
let resultList = [];

let currentComparison = 0;
let history = [];

// ✅ 결과 화면 진입 여부 (결과에서는 보조버튼 재배치 금지)
let isFinished = false;

// ===== UTIL =====
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function openYouTube(videoId) {
  window.open(
    `https://www.youtube.com/watch?v=${videoId}`,
    "_blank",
    "noopener,noreferrer"
  );
}

// 썸네일: maxres 먼저 시도 → 실패하면 hq
function setThumb(imgEl, videoId) {
  if (!imgEl || !videoId) return;

  const maxres = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const hq = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  imgEl.onerror = null;
  imgEl.src = maxres;

  imgEl.onerror = () => {
    imgEl.onerror = null;
    imgEl.src = hq;
  };
}

// (필요하면 곡별 보정값 여기서만 조정)
function getZoom(song) {
  // STEP IT UP 확대 싫다 했으니 1.00
  if (song.video === "ZZ1lfi_oXto") return 1.00;
  return 1.00;
}

// ===== Undo =====
function cloneStack(stack) {
  return stack.map((group) => group.slice());
}

function saveState() {
  history.push({
    songs: songs.slice(),
    mergeStack: cloneStack(mergeStack),
    leftList: leftList.slice(),
    rightList: rightList.slice(),
    resultList: resultList.slice(),
    currentComparison,
  });
}

function restoreState(state) {
  // ✅ 결과에서 되돌리면 다시 소트 화면
  isFinished = false;

  songs = state.songs.slice();
  mergeStack = cloneStack(state.mergeStack);
  leftList = state.leftList.slice();
  rightList = state.rightList.slice();
  resultList = state.resultList.slice();
  currentComparison = state.currentComparison;

  songContainer.style.display = "flex";
  resultDiv.innerHTML = "";

  showCompare();
  placeAuxButtons();
}

// ===== 모바일에서 tie/undo를 "분리된 줄(auxRow)"로 이동 =====
function placeAuxButtons() {
  // ✅ 결과 화면에서는 절대 auxRow를 다시 켜지 않게
  if (isFinished) {
    if (auxRow) auxRow.style.display = "none";
    return;
  }

  const isMobile = window.matchMedia("(max-width: 700px)").matches;

  const middle = document.querySelector(".middle");
  const vs = document.getElementById("vs");

  if (!middle || !vs || !tieBtn || !undoBtn) return;

  if (isMobile) {
    // 모바일: auxRow 표시 + 분리된 줄로 이동
    if (auxRow) auxRow.style.display = "grid";
    if (auxLeft) auxLeft.appendChild(tieBtn);
    if (auxRight) auxRight.appendChild(undoBtn);
  } else {
    // PC: auxRow 숨김 + middle로 원복
    if (auxRow) auxRow.style.display = "none";
    middle.insertBefore(tieBtn, vs);
    middle.appendChild(undoBtn);
  }
}

// ===== START =====
startBtn.onclick = () => {
  // ✅ 시작하면 결과 상태 해제
  isFinished = false;

  const includeDP = document.getElementById("debutToggle").checked;
  songs = includeDP ? ididSongs.concat(debutSongs) : [...ididSongs];

  startScreen.style.display = "none";
  sortScreen.style.display = "flex";

  songContainer.style.display = "flex";
  resultDiv.innerHTML = "";

  history = [];
  currentComparison = 0;

  startSort();
  placeAuxButtons();
};

// ===== SORT =====
function startSort() {
  songs = shuffle(songs);
  mergeStack = songs.map((song) => [song]);
  nextMerge();
}

function nextMerge() {
  if (mergeStack.length === 1) {
    songs = mergeStack[0];
    finishSort();
    return;
  }

  leftList = mergeStack.shift();
  rightList = mergeStack.shift();
  resultList = [];

  showCompare();
}

function showCompare() {
  if (leftList.length === 0) {
    resultList = resultList.concat(rightList);
    mergeStack.push(resultList);
    nextMerge();
    return;
  }

  if (rightList.length === 0) {
    resultList = resultList.concat(leftList);
    mergeStack.push(resultList);
    nextMerge();
    return;
  }

  const left = leftList[0];
  const right = rightList[0];

  leftBtn.innerText = left.title;
  rightBtn.innerText = right.title;

  setThumb(leftThumb, left.video);
  setThumb(rightThumb, right.video);

  leftThumb.style.transform = `scale(${getZoom(left)})`;
  rightThumb.style.transform = `scale(${getZoom(right)})`;

  leftThumb.onclick = () => openYouTube(left.video);
  rightThumb.onclick = () => openYouTube(right.video);

  leftBtn.onclick = chooseLeft;
  rightBtn.onclick = chooseRight;
  tieBtn.onclick = chooseTie;

  // undo는 아래에 한 번만 연결해둔 걸 그대로 사용
  placeAuxButtons();
}

// ===== 선택 =====
function chooseLeft() {
  saveState();
  currentComparison++;
  resultList.push(leftList.shift());
  showCompare();
}

function chooseRight() {
  saveState();
  currentComparison++;
  resultList.push(rightList.shift());
  showCompare();
}

function chooseTie() {
  saveState();
  currentComparison++;
  resultList.push(leftList.shift());
  resultList.push(rightList.shift());
  showCompare();
}

// ===== Undo =====
undoBtn.onclick = () => {
  if (history.length === 0) return;
  restoreState(history.pop());
};

// ===== 결과 (1위만 썸네일) =====
function finishSort() {
  saveState();

  // ✅ 결과 화면 상태로 전환
  isFinished = true;

  songContainer.style.display = "none";
  if (auxRow) auxRow.style.display = "none"; // ✅ 결과에선 숨김

  let html = `<h2 class="result-title">결과</h2>`;

  songs.forEach((song, index) => {
    if (index === 0) {
      html += `
        <div class="result-item top1-card">
          <div class="top1-rank">🥇 1위</div>
          <img id="top1" class="top1-thumb" alt="${song.title}">
          <div class="top1-name">${song.title}</div>
        </div>
      `;
      return;
    }

    html += `
      <div class="result-item">
        <div class="rank"><b>${index + 1}위</b></div>
        <div class="name">${song.title}</div>
      </div>
    `;
  });

  resultDiv.innerHTML = html;

  const top1 = songs[0];
  const img = document.getElementById("top1");
  if (img && top1) {
    setThumb(img, top1.video);
    img.style.transform = `scale(${getZoom(top1)})`;
    img.onclick = () => openYouTube(top1.video);
  }
}

// ===== 반응형 배치 이벤트 =====
window.addEventListener("load", placeAuxButtons);
window.addEventListener("resize", placeAuxButtons);

// ===== DATA =====
const ididSongs = [
  { title: "제멋대로 찬란하게", video: "gBqJn6Fv_ng" },
  { title: "SLOW TIDE", video: "Etjt37iz7B0" },
  { title: "STEP IT UP", video: "ZZ1lfi_oXto" },
  { title: "ImPerfect", video: "RlqKNM0_8dI" },
  { title: "So G.oo.D (네가 미치도록 좋아)", video: "PYKpzl-pJ1w" },
  { title: "STICKY BOMB", video: "x7Xy2_IB7sE" },
  { title: "꿈을 꿰뚫는 순간(飛必沖天)", video: "icDYjPpsgyw" },
  { title: "꽃피울 CROWN", video: "RpK0jo9pLOs" },
  { title: "PUSH BACK", video: "dnZU-t8Cm0o" },
  { title: "Heaven Smiles", video: "S6ZZ0Z0neyo" },
];

const debutSongs = [
  { title: "I'm OK, You're OK", video: "NaJi2yT56P0" },
  { title: "DWN", video: "BqUDcsArEyQ" },
  { title: "New A.G.K.", video: "bfMe-OqZ0sc" },
  { title: "Battle Scars", video: "EERhax2pooU" },
  { title: "우주를 이대로", video: "Or6YYQlHIY8" },
  { title: "편지가 된 일기", video: "08NOySx8O6U" },
  { title: "Balla", video: "CCTizL5L2h8" },
  { title: "둘만 아는 PASSWORD", video: "ozxWMi3a2tU" },
  { title: "STEP UP", video: "21NHeLirR68" },
];