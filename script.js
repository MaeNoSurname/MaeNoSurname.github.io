// --- Canvas & Leaves ---
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let DPR = Math.max(1, window.devicePixelRatio || 1);

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

const rand = (a, b) => a + Math.random() * (b - a);
const leafImg = new Image();
leafImg.src = "https://static.vecteezy.com/system/resources/previews/015/100/148/non_2x/autumn-leaf-transparent-background-free-png.png";

class Leaf {
  constructor(w, h) { this.reset(w, h); }
  reset(w, h) {
    this.x = rand(0, w);
    this.y = rand(h, -10);
    this.linearVelocity = { x: rand(-0.2,0.2), y: rand(0.6,2.2) };
    this.size = rand(40, 100);
    this.rotation = rand(0, Math.PI*2);
    this.angularSpeed = rand(-0.02,0.02);
    this.swayPhase = rand(0, Math.PI*2);
    this.swaySpeed = rand(0.005,0.015);
    this.swayAmplitude = rand(6,28);
    this.opacity = rand(0.6,1);
  }
  update(dt, w, h, globalWind) {
    const s = dt / 16.6667;
    this.swayPhase += this.swaySpeed * s;
    const sway = Math.sin(this.swayPhase) * this.swayAmplitude;
    this.linearVelocity.x += (globalWind - this.linearVelocity.x) * 0.002 * s;
    this.x += (this.linearVelocity.x + sway * 0.001) * this.size * 0.12 * s;
    this.y += this.linearVelocity.y * this.size * 0.06 * s;
    this.rotation += this.angularSpeed * s;
    if(this.y-this.size > h+40 || this.x<-100 || this.x>w+100){this.reset(w,h); this.y=rand(-200,-10);}
  }
  draw(ctx){
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x,this.y);
    ctx.rotate(this.rotation);
    const s = this.size;
    ctx.drawImage(leafImg,-s/2,-s/2,s,s);
    ctx.restore();
  }
}

let leaves = [], last = performance.now(), desiredCount=15, globalWind=0;
function regen() { leaves=[]; for(let i=0;i<desiredCount;i++) leaves.push(new Leaf(canvas.width/DPR,canvas.height/DPR)); }

function frame(now){
  const dt = now-last; last=now;
  const w = canvas.width/DPR, h=canvas.height/DPR;
  ctx.clearRect(0,0,w,h);
  const maxLeafSize = Math.max(...leaves.map(l=>l.size));
  for(const leaf of leaves) leaf.update(dt,w,h,globalWind);
  for(const leaf of leaves.filter(l=>l.size<=maxLeafSize/2)) leaf.draw(ctx);
  for(const leaf of leaves.filter(l=>l.size>maxLeafSize/2)) leaf.draw(ctx);
  globalWind += rand(-0.02,0.02);
  globalWind = Math.max(-1.2, Math.min(1.2, globalWind));
  requestAnimationFrame(frame);
}
leafImg.onload = () => { regen(); requestAnimationFrame(frame); };

// --- Gallery Code ---
const githubUser = 'MaeNoSurname',
      repo = 'portfolio-images',
      folder = 'images',
      apiURL = `https://api.github.com/repos/${githubUser}/${repo}/contents/${folder}`;
let images = [];
const imageScroll = document.getElementById('image-scroll');

async function fetchGithubImages() {
  const res = await fetch(apiURL);
  const files = await res.json();
  const imageFiles = files.filter(f => /\.(png|jpe?g|gif|webp)$/i.test(f.name));
  imageScroll.innerHTML='';
  imageFiles.forEach((file,i)=>{
    const div = document.createElement('div');
    div.className='image-container';
    div.dataset.title=file.name.replace(/\.[^/.]+$/,"");
    div.dataset.desc='GitHub hosted image';
    const img = document.createElement('img');
    img.src=file.download_url; img.alt=file.name;
    div.appendChild(img);
    imageScroll.appendChild(div);
    div.addEventListener('click',()=>openLightbox(i));
    div.tabIndex=0;
    div.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openLightbox(i); }});
  });
  images = Array.from(document.querySelectorAll('#image-scroll .image-container')).map(c=>{ const img=c.querySelector('img'); return { src: img.src, alt: img.alt, title: c.dataset.title, desc: c.dataset.desc }; });
  buildThumbs();
  if(images[0]) new Image().src = images[0].src;
}

const lightbox = document.getElementById('lightbox'),
      lbImage = document.getElementById('lb-image'),
      lbTitle = document.getElementById('lb-title'),
      lbDesc = document.getElementById('lb-desc'),
      lbThumbs = document.getElementById('lb-thumbs'),
      lbClose = document.querySelector('.lb-close'),
      lbPrev = document.querySelector('.lb-prev'),
      lbNext = document.querySelector('.lb-next');
let currentIndex = 0;

function buildThumbs(){
  lbThumbs.innerHTML='';
  images.forEach((im,i)=>{
    const t=document.createElement('img');
    t.src=im.src; t.alt=im.alt; t.dataset.index=i;
    t.addEventListener('click',()=>showAt(i));
    lbThumbs.appendChild(t);
  });
}

function updateThumbs(){
  Array.from(lbThumbs.children).forEach((n,i)=>{ n.classList.toggle('active', i===currentIndex); });
  const active = lbThumbs.children[currentIndex];
  if(active) active.scrollIntoView({ behavior:'smooth', inline:'center' });
}

function showAt(i){
  currentIndex=(i+images.length)%images.length;
  const im=images[currentIndex];
  lbImage.src=im.src; lbImage.alt=im.alt;
  lbTitle.textContent=im.title;
  lbDesc.textContent=im.desc;
  updateThumbs();
}

function openLightbox(index=0){ showAt(index); buildThumbs(); lightbox.classList.add('show'); lightbox.setAttribute('aria-hidden','false'); }
function closeLightbox(){ lightbox.classList.remove('show'); lightbox.setAttribute('aria-hidden','true'); }

lbPrev.addEventListener('click',()=>showAt(currentIndex-1));
lbNext.addEventListener('click',()=>showAt(currentIndex+1));
lbClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if(e.target===lightbox) closeLightbox(); });
document.addEventListener('keydown', e => {
  if(!lightbox.classList.contains('show')) return;
  if(e.key==='Escape') closeLightbox();
  if(e.key==='ArrowLeft') showAt(currentIndex-1);
  if(e.key==='ArrowRight') showAt(currentIndex+1);
});

fetchGithubImages();
