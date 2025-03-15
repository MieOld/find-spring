let handPose;
let video;
let hands = [];
let frameImg; // PNG 框架图片

function preload() {
  // 加载 ml5.js 的 handPose 模型（注意大写 P）
  handPose = ml5.handPose();
  // 加载 PNG 图片，请确保 frame.png 在项目目录中
  frameImg = loadImage("frame.png");
}

function setup() {
  // 使用手机屏幕尺寸作为画布大小
  createCanvas(windowWidth, windowHeight);
  // 降低帧率以提高性能
  frameRate(15);
  
  // 创建摄像头视频，设置较低分辨率以降低处理量
  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide();
  
  // 开始检测手部
  handPose.detectStart(video, gotHands);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function gotHands(results) {
  hands = results;
}

// 返回一只手中大拇指尖（索引 4）与食指尖（索引 8）之间距离的一半（视频坐标）
function getHandRadius(hand) {
  let thumbTip = hand.keypoints[4];
  let indexTip = hand.keypoints[8];
  return dist(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y) / 2;
}

function draw() {
  background(255);
  
  // 计算视频到画布的缩放因子
  let scaleX = width / video.width;
  let scaleY = height / video.height;
  
  // ---------------------------
  // 1. 绘制剪裁后的视频（只显示手势圈出的圆形区域）
  // ---------------------------
  if (hands.length > 0) {
    let hand = hands[0];
    let thumbTip = hand.keypoints[4];
    let indexTip = hand.keypoints[8];
    
    // 将手指坐标转换为画布坐标
    let thumbX = thumbTip.x * scaleX;
    let thumbY = thumbTip.y * scaleY;
    let indexX = indexTip.x * scaleX;
    let indexY = indexTip.y * scaleY;
    
    // 圆形剪裁区域中心取大拇指尖与食指尖中点
    let clipCenterX = (thumbX + indexX) / 2;
    let clipCenterY = (thumbY + indexY) / 2;
    
    // 计算剪裁半径（转换到画布坐标）
    let rawRadius = getHandRadius(hand); // 视频坐标下的半径
    let scaledRadius = ((rawRadius * scaleX) + (rawRadius * scaleY)) / 2;
    
    // 使用剪裁功能只显示圆形区域内的视频
    push();
      drawingContext.beginPath();
      drawingContext.arc(clipCenterX, clipCenterY, scaledRadius, 0, TWO_PI);
      drawingContext.clip();
      image(video, 0, 0, width, height);
    pop();
    
    // 可选：绘制剪裁圆的边框（调试用，可去掉以提高性能）
    stroke(0);
    strokeWeight(2);
    noFill();
    ellipse(clipCenterX, clipCenterY, scaledRadius * 2, scaledRadius * 2);
  } else {
    // 未检测到手时可选择不显示任何提示或显示简单提示
    fill(0);
     noStroke();
     textSize(24);
     textAlign(CENTER, CENTER);
     text("请寻找春天", width / 2, height / 2);
  }
  
  // ---------------------------
  // 2. 绘制 PNG 框架图，且尺寸随着手势圈大小变化
  //    只有检测到手时才显示 PNG 框架图
  // ---------------------------
  if (hands.length > 0) {
    let pngCenterX, pngCenterY, frameSize;
    let scaleFactor = 1.5; // 控制 PNG 图相对于剪裁圆的比例
    
    if (hands.length >= 2) {
      // 如果检测到两只手，取两只手食指尖（索引8）中点作为中心
      let indexTip1 = hands[0].keypoints[8];
      let indexTip2 = hands[1].keypoints[8];
      pngCenterX = ((indexTip1.x * scaleX) + (indexTip2.x * scaleX)) / 2;
      pngCenterY = ((indexTip1.y * scaleY) + (indexTip2.y * scaleY)) / 2;
      
      let r1 = getHandRadius(hands[0]);
      let r2 = getHandRadius(hands[1]);
      let avgRadius = (((r1 * scaleX) + (r2 * scaleX)) / 2);
      frameSize = avgRadius * 2 * scaleFactor;
    } else {
      // 只有一只手时，以该手的食指尖（索引8）为中心
      pngCenterX = hands[0].keypoints[8].x * scaleX;
      pngCenterY = hands[0].keypoints[8].y * scaleY;
      let r = getHandRadius(hands[0]);
      let scaledR = ((r * scaleX) + (r * scaleY)) / 2;
      frameSize = scaledR * 2 * scaleFactor;
    }
    
    push();
      // 重置变换，确保 PNG 图固定在预定位置
      resetMatrix();
      image(frameImg, pngCenterX - frameSize / 2, pngCenterY - frameSize / 2, frameSize, frameSize);
    pop();
  }
}
