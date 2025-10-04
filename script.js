const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let DPR = Math.max(1, window.devicePixelRatio || 1);

// Resize canvas for high-DPI
function resize() {
  DPR = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(innerWidth * DPR);
  canvas.height = Math.floor(innerHeight * DPR);
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
addEventListener("resize", resize);
resize();

// Helper for random numbers
const rand = (a, b) => a + Math.random() * (b - a);

// Load maple leaf image
const leafImg = new Image();
leafImg.src =
  "https://static.vecteezy.com/system/resources/previews/015/100/148/non_2x/autumn-leaf-transparent-background-free-png.png"; // Example URL, you can replace with your own
leafImg.onload = () => {
  regen(); // Only generate leaves once image is loaded
  requestAnimationFrame(frame);
};

class Leaf {
  constructor(w, h) {
    this.reset(w, h);
  }

  reset(w, h) {
    this.x = rand(0, w);
    this.y = rand(h, -10);
    this.linearVelocity = { x: rand(-0.2, 0.2), y: rand(0.6, 2.2) };
    this.size = rand(40, 100);
    this.rotation = rand(0, Math.PI * 2);
    this.angularSpeed = rand(-0.02, 0.02);
    this.swayPhase = rand(0, Math.PI * 2);
    this.swaySpeed = rand(0.005, 0.015);
    this.swayAmplitude = rand(6, 28);
    this.opacity = rand(0.6, 1);
  }

  update(dt, w, h, globalWind) {
    const s = dt / 16.6667;
    this.swayPhase += this.swaySpeed * s;
    const sway = Math.sin(this.swayPhase) * this.swayAmplitude;

    this.linearVelocity.x += (globalWind - this.linearVelocity.x) * 0.002 * s;

    this.x += (this.linearVelocity.x + sway * 0.001) * this.size * 0.12 * s;
    this.y += this.linearVelocity.y * this.size * 0.06 * s;
    this.rotation += this.angularSpeed * s;

    if (this.y - this.size > h + 40 || this.x < -100 || this.x > w + 100) {
      this.reset(w, h);
      this.y = rand(-200, -10);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    const s = this.size;

    // Draw the leaf image
    ctx.drawImage(leafImg, -s / 2, -s / 2, s, s);

    ctx.restore();
  }
}

let leaves = [];
let last = performance.now();
let desiredCount = 10;
let globalWind = 1;
let canvasRotation = 45;
let rotationPhase = 0;

function regen() {
  leaves = [];
  for (let i = 0; i < desiredCount; i++) {
    leaves.push(new Leaf(canvas.width / DPR, canvas.height / DPR));
  }
}

function frame(now) {
  const dt = now - last;
  last = now;
  const w = canvas.width / DPR;
  const h = canvas.height / DPR;
  ctx.clearRect(0, 0, w, h);

  rotationPhase += 0.002 * dt;
  canvasRotation = Math.sin(rotationPhase) * 0.03;

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(canvasRotation);
  ctx.translate(-w / 2, -h / 2);

  const maxLeafSize = Math.max(...leaves.map((l) => l.size));
  for (const leaf of leaves) leaf.update(dt, w, h, globalWind);

  for (const leaf of leaves.filter((l) => l.size <= maxLeafSize / 2))
    leaf.draw(ctx);
  for (const leaf of leaves.filter((l) => l.size > maxLeafSize / 2))
    leaf.draw(ctx);

  ctx.restore();

  globalWind += rand(-0.02, 0.02);
  globalWind = Math.max(-1.2, Math.min(1.2, globalWind));

  requestAnimationFrame(frame);
}
const scroller = document.getElementById("image-scroll");

scroller.addEventListener("wheel", (e) => {
  e.preventDefault(); // Prevent vertical page scroll
  scroller.scrollLeft += e.deltaY * 5; // Scroll horizontally instead
});