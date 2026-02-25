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

const progressEl = document.getElementById("progress");

// ===== STATE =====
let songs = [];
let mergeStack = [];
let leftList = [];
let rightList = [];
let resultList = [];

let totalComparisons = 0;
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

function estimateTotalComparisons(n) {
  return Math.ceil(n * Math.log2(Math.max(2, n)));
}

function updateProgress() {
  if (progressEl) {
    progressEl.innerText = `${currentComparison} / ${totalComparisons}`;
  }
}

function openYouTube(videoId) {
  window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
}

// ===== 썸네일 fallback =====
function setThumb(imgEl, videoId) {
  const maxres = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const hq = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  imgEl.onerror = null;
  imgEl.src = maxres;

  imgEl.onerror = () => {
    imgEl.onerror = null;
    imgEl.src = hq;
  };
}

// ===== STEP IT UP 보정 =====
function getZoom(song) {
  if (song.video === "ZZ1lfi_oXto") return 1.00;
  return 1;
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
    currentComparison
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
  updateProgress();
}

// ===== START =====
startBtn.onclick = () => {
  const includeDP = document.getElementById("debutToggle").checked;
  songs = includeDP ? ididSongs.concat(debutSongs) : [...ididSongs];

  startScreen.style.display = "none";
  if (sortScreen) sortScreen.style.display = "block";

  songContainer.style.display = "flex";
  resultDiv.innerHTML = "";

  history = [];
  currentComparison = 0;
  totalComparisons = estimateTotalComparisons(songs.length);

  startSort();
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

  let left = leftList[0];
  let right = rightList[0];

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

  updateProgress();
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

// ===== 결과 =====
function finishSort() {
  saveState();
  songContainer.style.display = "none";

  let html = `<h2 style="margin:20px 0;">결과</h2>`;

  songs.forEach((song, index) => {
    if (index === 0) {
      html += `
        <div class="result-item">
          <div style="font-weight:800; margin-bottom:10px;">🥇 1위</div>
          <img id="top1" class="top1-thumb">
          <div style="font-weight:700;">${song.title}</div>
        </div>
      `;
      return;
    }

    html += `
      <div class="result-item">
        <div><b>${index + 1}위</b></div>
        <div>${song.title}</div>
      </div>
    `;
  });

  resultDiv.innerHTML = html;

  // 1위 썸네일 처리
  const top1 = songs[0];
  const img = document.getElementById("top1");

  setThumb(img, top1.video);
  img.style.transform = `scale(${getZoom(top1)})`;
  img.onclick = () => openYouTube(top1.video);

  updateProgress();
}

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