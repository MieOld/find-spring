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
  
  // 使用后置摄像头，视频分辨率设为 640x480（比 320x240 更清晰）
  let constraints = {
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 640 },
      height: { ideal: 480 }
    }
  };
  video = createCapture(constraints);
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

// 返回一只手中大拇指尖（索引 4）与食指尖（索引 8）之间距离的一半（视频坐标下）
function getHandRadius(hand) {
  let thumbTip = hand.keypoints[4];
  let indexTip = hand.keypoints[8];
  return dist(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y) / 2;
}

function draw() {
  background(255);
  
  // 计算视频绘制区域，保持原始宽高比
  let videoAspect = video.width / video.height;
  let canvasAspect = width / height;
  let drawX, drawY, drawW, drawH;
  if (canvasAspect > videoAspect) {
    // 画布较宽，视频填满高度
    drawH = height;
    drawW = height * videoAspect;
    drawX = (width - drawW) / 2;
    drawY = 0;
  } else {
    // 画布较窄，视频填满宽度
    drawW = width;
    drawH = width / videoAspect;
    drawX = 0;
    drawY = (height - drawH) / 2;
  }
  
  // 绘制保持正确比例的视频
  image(video, drawX, drawY, drawW, drawH);

    

  
  // 如果检测到手部，则不显示文本 "春天在哪里" 和 "尝试用两指靠近或拉开，发现更多春日美景"
  if (hands.length > 0) {
    let hand = hands[0];
    let thumbTip = hand.keypoints[4];
    let indexTip = hand.keypoints[8];
    
    // 计算视频到画布的缩放因子
    let scaleX = drawW / video.width;
    let scaleY = drawH / video.height;
    // 转换手指坐标到画布坐标（加上绘制区域偏移量）
    let thumbX = thumbTip.x * scaleX + drawX;
    let thumbY = thumbTip.y * scaleY + drawY;
    let indexX = indexTip.x * scaleX + drawX;
    let indexY = indexTip.y * scaleY + drawY;
    
    // 计算剪裁蒙版的圆心和半径（圆心取大拇指和食指中点，半径为两者距离的一半）
    let clipCenterX = (thumbX + indexX) / 2;
    let clipCenterY = (thumbY + indexY) / 2;
    let rawRadius = getHandRadius(hand);
    let scaledRadius = ((rawRadius * scaleX) + (rawRadius * scaleY)) / 2;
    
    // 绘制遮罩：用“evenodd”规则绘制整个画布的矩形，
    // 再减去圆形区域（显示视频原样），其余区域白色覆盖，透明度90%
    push();
      let ctx = drawingContext;
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.moveTo(clipCenterX + scaledRadius, clipCenterY);
      ctx.arc(clipCenterX, clipCenterY, scaledRadius, 0, TWO_PI);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fill("evenodd");
    pop();
    
    // 可选：绘制剪裁圆边框（调试用）
    stroke("#6CD5FF"); // 设置边框颜色为字体的蓝色
    strokeWeight(5);
    noFill();
    ellipse(clipCenterX, clipCenterY, scaledRadius * 2, scaledRadius * 2);
    
    // 绘制 PNG 框架图：以食指尖为中心，尺寸按圆的大小变化
    let pngCenterX = indexX;
    let pngCenterY = indexY;
    let scaleFactor = 1.5;
    let frameSize = scaledRadius * 2 * scaleFactor;
    
    push();
      resetMatrix(); // 恢复默认变换，确保 PNG 框架位置正确
      image(frameImg, pngCenterX - frameSize / 2, pngCenterY - frameSize / 2, frameSize, frameSize);
    pop();
  }

  // 绘制UI文字部分
  // 左上角 "Seeking Spring"
  fill("#FFFFFF");
  noStroke();
  textSize(54);
  textAlign(LEFT, TOP);
  textFont('Times New Roman'); // 英文字体（衬线字体）
  text("Seeking Spring", 80, 230);
  
  // 左上角 "双指之间，春日可见"
  fill("#6CD5FF");
  noStroke();
  textSize(36);
  textAlign(LEFT, TOP);
  textFont('SimSun'); // 中文字体（宋体）
  text("双指之间，春日可见", 80, 280);

  // 右上角 "寻·春"
  fill("#6CD5FF");
  textSize(72);
  textAlign(RIGHT, TOP);
  textFont('SimSun'); // 中文字体（宋体）
  text("寻·春", width - 80, 230);

  // 左下角 "march 2025"
  fill("#6CD5FF");
  textSize(36);
  textAlign(LEFT, BOTTOM);
  textFont('Times New Roman'); // 英文字体（衬线字体）
  text("March 2025", 80, height - 250);

  // 右下角 "By MieOld"
  fill("#FFFFFF");
  textSize(36);
  textAlign(RIGHT, BOTTOM);
  textFont('Times New Roman'); // 英文字体（衬线字体）
  text("By MieOld", width - 80, height - 250);


  // 在没有手时显示文本
  if (hands.length === 0) {
    fill("#6CD5FF");
    textSize(54);
    textAlign(CENTER, CENTER);
    textFont('SimSun'); // 中文字体（宋体）
    text("春  天  在  哪  里", width / 2 , height * 0.5);
    textSize(24);
    textFont('Arial'); // 中文字体（无衬线字体）
    fill("#FFFFFF");
    text("尝试用两指靠近或拉开，发现更多春日美景。", width / 2, height * 0.6);
  }
}



