let gravity = 0.5;
let velocity = 0;
let birdY = 300;

let jumpBase = -9;
let jump = jumpBase;

let pipes = [];
let items = [];
let clouds = [];

let frame = 0;
let score = 0;
let gameState = "start";

let birdImg;
let pipeTopImg;
let pipeBottomImg;

// 道具圖片
let itemScoreImg;
let itemSpeedImg;
let itemShrinkImg;
let itemInvincibleImg;

let angle = 0;
const birdX = 100;

// 可變參數
let birdSize = 80;
let pipeSpeed = 3;

// buff 狀態
let invincible = false;
let invincibleUntil = 0;
let shrinkUntil = 0;
let speedUntil = 0;

// 圖片載入
function preload() {
  birdImg = loadImage("assets/bird.png");
  pipeTopImg = loadImage("assets/pipe_top.png");
  pipeBottomImg = loadImage("assets/pipe_bottom.png");
  itemScoreImg = loadImage("assets/item_score.png");
  itemSpeedImg = loadImage("assets/item_speed.png");
  itemShrinkImg = loadImage("assets/item_shrink.png");
  itemInvincibleImg = loadImage("assets/item_invincible.png");
  cloudImg = loadImage("assets/cloud2.png");
}

// 設定
function setup() {
  createCanvas(550, 700);
  textAlign(CENTER);  // 文字對齊
  textSize(28);
  imageMode(CENTER);  // 圖片正中心對齊

  let cloudCount = 3; // 一開始幾朵雲
  for (let i = 0; i < cloudCount; i++) {
    let cloud = {
      // 平均分散在畫面寬度
      x: (width / cloudCount) * i + random(-30, 30),
      y: random(50, 250),        // 天空高度
      size: random(60, 120),     // 大小
      speed: random(0.3, 0.8)    // 飄動速度
    };
    clouds.push(cloud);
  }
}

function draw() {
  background(135, 206, 235);  // 天空藍
  frame++;   // 計算遊戲幀數

  updateClouds();
  drawClouds();

  if (gameState === "start") {
    fill(255, 230, 0);  // 黃色
    textSize(50);
    text("Flappy Bird", width / 2, height / 2 - 80);

    textSize(24);
    fill(255);
    text("Press SPACE to start", width / 2, height / 2);

    return;
  }

  updateEffects();  // 更新buff狀態

  if (gameState === "playing") {

    // 鳥的跳躍
    velocity += gravity;
    birdY += velocity;

    // 鳥的角度
    if (velocity < -8) {
      angle = -PI / 18;
    } else {
      angle = map(velocity, -8, 10, -PI / 18, PI / 18, true);
    }

    // 生成水管
    // 每 100 幀生成一組水管
    if (frame % 100 === 0) {
      let maxTop = pipeTopImg.height;
      let top = random(100, maxTop);
      let gap = 250;

      let newPipe = { x: width, top: top, gap: gap, passed: false };
      pipes.push(newPipe);

      maybeSpawnItem(width + 190, top, gap);
    }

    // 移動水管
    for (let i = 0; i < pipes.length; i++) {
      pipes[i].x -= pipeSpeed;
    }

    // 過濾掉超出畫面的水管
    let newPipes = [];
    for (let i = 0; i < pipes.length; i++) {
      let p = pipes[i];
      if (p.x + 90 > 0) {
        newPipes.push(p);
      }
    }
    pipes = newPipes;

    // ===== 畫水管 =====
    for (let i = 0; i < pipes.length; i++) {
      let p = pipes[i];

      // 上水管（裁切圖片下半部）
      // image(img, dx, dy, dw, dh, sx, sy, sw, sh);
      // 從圖片的 (sx, sy) 裁一塊 (sw × sh)，然後把它畫成 (dw × dh)，放在畫布的 (dx, dy)
      image(
        pipeTopImg,
        p.x + 45,
        p.top / 2,
        90,
        p.top,
        0,
        pipeTopImg.height - p.top,
        90,
        p.top
      );

      // 下水管（裁切圖片上半部）
      let bottomH = height - (p.top + p.gap);
      image(
        pipeBottomImg,
        p.x + 45,
        p.top + p.gap + bottomH / 2,
        90,
        bottomH,
        0,
        0,
        90,
        bottomH
      );
    }

    // 道具移動
    for (let i = 0; i < items.length; i++) {
      items[i].x -= pipeSpeed;
    }

    // 過濾掉超出畫面的items
    let newItems = [];
    for (let i = 0; i < items.length; i++) {
      let it = items[i];
      if (it.x + it.size > 0 && it.gone === false) {
        newItems.push(it);
      }
    }
    items = newItems;

    // 畫道具
    for (let i = 0; i < items.length; i++) {
      drawItem(items[i]);
    }

    checkItemCollision();

    // 畫鳥
    push();
    translate(birdX, birdY);
    rotate(angle);

    let alpha = 255;
    if (
      isEffectEnding(invincibleUntil) ||
      isEffectEnding(shrinkUntil) ||
      isEffectEnding(speedUntil)
    ) {
      if (frame % 10 < 5) {
        alpha = 80;
      } else {
        alpha = 255;
      }
    }

    tint(255, alpha);
    image(birdImg, 0, 0, birdSize, birdSize);
    noTint();

    if (invincible) {
      noFill();
      stroke(255, alpha);
      strokeWeight(4);
      circle(0, 0, birdSize + 20);
      noStroke();
    }

    pop();

    // 碰撞
    if (!invincible) {
      for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];

        let hitX =
          birdX + birdSize / 2 > p.x &&
          birdX - birdSize / 2 < p.x + 90;

        let hitY =
          birdY - birdSize / 2 < p.top ||
          birdY + birdSize / 2 > p.top + p.gap;

        if (hitX && hitY) {
          gameState = "gameover";
        }
      }
    }

    if (birdY < 0 || birdY > height) {
      gameState = "gameover";
    }

    // 計分
    for (let i = 0; i < pipes.length; i++) {
      let p = pipes[i];
      if (p.passed === false && birdX > p.x + 90) {
        score++;
        p.passed = true;
      }
    }

    fill(255);
    textAlign(LEFT);
    textSize(28);
    text("Score: " + score, 10, 35);
  }


  // 遊戲結束
  if (gameState === "gameover") {
    fill(255);
    textAlign(CENTER);
    textSize(50);
    text("Game Over!", width / 2, height / 2 - 80);

    textSize(28);
    text("Score: " + score, width / 2, height / 2 - 20);

    textSize(22);
    text("Press SPACE to back", width / 2, height / 2 + 30);
  }
}

function keyPressed() {
  if (key === " ") {
    if (gameState === "start") {
      startGame();
    } else if (gameState === "playing") {
      velocity = jump;
    } else if (gameState === "gameover") {
      resetGame();
      gameState = "start";
    }
  }
}

function startGame() {
  resetGame();
  gameState = "playing";
}

function resetGame() {
  birdY = 300;
  velocity = 0;
  pipes = [];
  items = [];
  score = 0;
  frame = 0;

  birdSize = 80;
  pipeSpeed = 3;
  jump = jumpBase;

  invincible = false;
  invincibleUntil = 0;
  shrinkUntil = 0;
  speedUntil = 0;
}

/* ===== 道具系統 ===== */

function maybeSpawnItem(x, top, gap) {
  if (random() > 0.5) return;

  let y = random(top - 40, top + gap + 40);
  let r = random();

  let type = "score";
  if (r < 0.4) {
    type = "score";
  } else if (r < 0.7) {
    type = "speed";
  } else if (r < 0.85) {
    type = "shrink";
  } else {
    type = "invincible";
  }

  // 設定顯示大小40x40
  let newItem = { x: x, y: y, type: type, size: 40, gone: false };
  items.push(newItem);
}

function getItemImage(type) {
  if (type === "score") return itemScoreImg;
  if (type === "speed") return itemSpeedImg;
  if (type === "shrink") return itemShrinkImg;
  return itemInvincibleImg;
}

function drawItem(it) {
  let img = getItemImage(it.type);
  if (!img) return;

  let floatY = sin(frame * 0.08 + it.x * 0.01) * 3;
  image(img, it.x, it.y + floatY, it.size, it.size);
}

function checkItemCollision() {
  for (let i = 0; i < items.length; i++) {
    let it = items[i];
    if (it.gone) continue;

    let d = dist(birdX, birdY, it.x, it.y);
    if (d < birdSize / 2 + it.size / 2) {
      it.gone = true;
      applyItemEffect(it.type);
    }
  }
}

function applyItemEffect(type) {
  let now = millis();

  if (type === "score") {
    score += 5;
  }

  if (type === "shrink") {
    birdSize = 52;
    shrinkUntil = now + 6000;
  }

  if (type === "speed") {
    pipeSpeed = 5;
    speedUntil = now + 6000;
  }

  if (type === "invincible") {
    invincible = true;
    invincibleUntil = now + 5000;
  }
}

function updateEffects() {
  let now = millis();

  if (now > shrinkUntil) {
    birdSize = 80;
  }

  if (now > speedUntil) {
    pipeSpeed = 3;
  }

  if (invincible && now > invincibleUntil) {
    invincible = false;
  }
}

function isEffectEnding(endTime, warningTime = 1000) {
  let now = millis();
  if (now > endTime - warningTime && now < endTime) {
    return true;
  }
  return false;
}


function updateClouds() {
  // 生成新雲（慢慢補）
  if (frame % 500 === 10) {
    let cloud = {
      x: width + 100,
      y: random(50, 250),
      size: random(60, 120),
      speed: random(0.3, 0.8)
    };
    clouds.push(cloud);
  }

  // 移動雲
  for (let i = 0; i < clouds.length; i++) {
    clouds[i].x -= clouds[i].speed;
  }

  // 清掉跑出畫面的雲
  let newClouds = [];
  for (let i = 0; i < clouds.length; i++) {
    if (clouds[i].x + clouds[i].size > 0) {
      newClouds.push(clouds[i]);
    }
  }
  clouds = newClouds;
}

function drawClouds() {
  for (let i = 0; i < clouds.length; i++) {
    let c = clouds[i];
    image(cloudImg, c.x, c.y, c.size, c.size * 0.6);
  }
}
