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
  
  // 创建摄像头视频，分辨率设为 640×480（比 320×240 清晰）
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

// 返回一只手中大拇指尖（索引4）与食指尖（索引8）之间距离的一半（基于视频坐标）
function getHandRadius(hand) {
  let thumbTip = hand.keypoints[4];
  let indexTip = hand.keypoints[8];
  return dist(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y) / 2;
}

function draw() {
  // 先绘制全屏视频
  background(255);
  image(video, 0, 0, width, height);
  
  // 若检测到手势，则绘制蒙版和 PNG 框架
  if (hands.length > 0) {
    // 取第一只手的数据
    let hand = hands[0];
    let thumbTip = hand.keypoints[4];
    let indexTip = hand.keypoints[8];
    
    // 计算视频到画布的缩放因子
    let scaleX = width / video.width;
    let scaleY = height / video.height;
    
    // 转换坐标
    let thumbX = thumbTip.x * scaleX;
    let thumbY = thumbTip.y * scaleY;
    let indexX = indexTip.x * scaleX;
    let indexY = indexTip.y * scaleY;
    
    // 以大拇指尖和食指尖的中点作为圆心
    let maskCenterX = (thumbX + indexX) / 2;
    let maskCenterY = (thumbY + indexY) / 2;
    // 半径为两点之间距离的一半（经过缩放）
    let rawRadius = getHandRadius(hand);
    let scaledRadius = ((rawRadius * scaleX) + (rawRadius * scaleY)) / 2;
    
    // 绘制遮罩：使用偶数填充规则，将整个画布填充白色（透明度 90%），但圆形区域为空（显示视频原样）
    push();
      let ctx = drawingContext;
      ctx.beginPath();
      // 外部路径：整个画布
      ctx.rect(0, 0, width, height);
      // 内部路径：蒙版区域
      ctx.moveTo(maskCenterX + scaledRadius, maskCenterY);
      ctx.arc(maskCenterX, maskCenterY, scaledRadius, 0, TWO_PI);
      ctx.closePath();
      // 填充白色，90% 不透明（alpha = 0.9）
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill("evenodd");
    pop();
    
    // 绘制 PNG 框架图
    // 以食指尖（索引8）为中心
    let pngCenterX = indexX;
    let pngCenterY = indexY;
    // PNG 图尺寸根据蒙版圆的直径和一个比例因子确定
    let scaleFactor = 1.5;
    let frameSize = scaledRadius * 2 * scaleFactor;
    
    push();
      resetMatrix(); // 恢复默认变换
      image(frameImg, pngCenterX - frameSize / 2, pngCenterY - frameSize / 2, frameSize, frameSize);
    pop();
  } else {
    // 没有检测到手时，可选择显示提示文字
    fill(0);
    noStroke();
    textSize(24);
    textAlign(CENTER, CENTER);
    text("请寻找春天", width / 2, height / 2);
  }
}
