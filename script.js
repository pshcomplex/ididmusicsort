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

// ===== STATE =====
let songs = [];
let mergeStack = [];
let leftList = [];
let rightList = [];
let resultList = [];

let currentComparison = 0;
let history = [];

// ===== UTIL =====
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function openYouTube(videoId) {
  window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank", "noopener,noreferrer");
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
  // STEP IT UP: 지금은 확대 안 함 (너가 싫다 했으니 1.00)
  if (song.video === "ZZ1lfi_oXto") return 1.00;
  return 1.00;
}

// ===== Undo =====
function cloneStack(stack) {
  return stack.map(group => group.slice());
}

function saveState() {
  history.push({
    songs: songs.slice(),
    mergeStack: cloneStack(mergeStack),
    leftList: leftList.slice(),
    rightList: rightList.slice(),
    resultList: resultList.slice(),
    currentComparison,
    // 버튼 위치도 되돌리기 위해 현재 모바일 배치 여부 저장해도 되지만
    // 여기서는 restore 후 placeAuxButtons()로 다시 정렬해줌
  });
}

function restoreState(state) {
  songs = state.songs.slice();
  mergeStack = cloneStack(state.mergeStack);
  leftList = state.leftList.slice();
  rightList = state.rightList.slice();
  resultList = state.resultList.slice();
  currentComparison = state.currentComparison;

  songContainer.style.display = "flex";
  resultDiv.innerHTML = "";

  showCompare();
  placeAuxButtons(); // ✅ 복원 후 모바일/PC 배치 다시 정렬
}

// ===== 모바일에서 tie/undo를 A 아래/B 아래로 이동 =====
function placeAuxButtons() {
  const isMobile = window.matchMedia("(max-width: 700px)").matches;

  const leftCard = document.querySelector(".leftSong");
  const rightCard = document.querySelector(".rightSong");
  const middle = document.querySelector(".middle");
  const vs = document.getElementById("vs");

  if (!leftCard || !rightCard || !middle || !vs) return;

  if (isMobile) {
    // 모바일: A 아래 / B 아래로 이동
    leftCard.appendChild(tieBtn);
    rightCard.appendChild(undoBtn);
  } else {
    // PC: middle로 원복 (tie 위, VS 가운데, undo 아래)
    middle.insertBefore(tieBtn, vs);
    middle.appendChild(undoBtn);
  }
}

// ===== START =====
startBtn.onclick = () => {
  const includeDP = document.getElementById("debutToggle").checked;
  songs = includeDP ? ididSongs.concat(debutSongs) : [...ididSongs];

  startScreen.style.display = "none";
  sortScreen.style.display = "flex";

  songContainer.style.display = "flex";
  resultDiv.innerHTML = "";

  history = [];
  currentComparison = 0;

  startSort();
  placeAuxButtons(); // ✅ 시작 시 배치
};

// ===== SORT =====
function startSort() {
  songs = shuffle(songs);
  mergeStack = songs.map(song => [song]);
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
  // 한쪽 비면 남은거 붙이고 스택으로 올림
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

  // undoBtn.onclick은 아래에 한 번만 걸어둔 걸 그대로 씀

  placeAuxButtons(); // ✅ 화면 회전/리사이즈 등에도 안정적으로 배치
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
  songContainer.style.display = "none";

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
  { title:"제멋대로 찬란하게", video:"gBqJn6Fv_ng" },
  { title:"SLOW TIDE", video:"Etjt37iz7B0" },
  { title:"STEP IT UP", video:"ZZ1lfi_oXto" },
  { title:"ImPerfect", video:"RlqKNM0_8dI" },
  { title:"So G.oo.D (네가 미치도록 좋아)", video:"PYKpzl-pJ1w" },
  { title:"STICKY BOMB", video:"x7Xy2_IB7sE" },
  { title:"꿈을 꿰뚫는 순간(飛必沖天)", video:"icDYjPpsgyw" },
  { title:"꽃피울 CROWN", video:"RpK0jo9pLOs" },
  { title:"PUSH BACK", video:"dnZU-t8Cm0o" },
  { title:"Heaven Smiles", video:"S6ZZ0Z0neyo" }
];

const debutSongs = [
  { title:"I'm OK, You're OK", video:"NaJi2yT56P0" },
  { title:"DWN", video:"BqUDcsArEyQ" },
  { title:"New A.G.K.", video:"bfMe-OqZ0sc" },
  { title:"Battle Scars", video:"EERhax2pooU" },
  { title:"우주를 이대로", video:"Or6YYQlHIY8" },
  { title:"편지가 된 일기", video:"08NOySx8O6U" },
  { title:"Balla", video:"CCTizL5L2h8" },
  { title:"둘만 아는 PASSWORD", video:"ozxWMi3a2tU" },
  { title:"STEP UP", video:"21NHeLirR68" }
];