const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreNum = document.getElementById('scoreNum');
const levelNum = document.getElementById('levelNum');
const paypalContainer = document.getElementById('paypal-button-container');
const unlockMsg = document.getElementById('unlock-msg');
const adBar = document.getElementById('ad-bar');
const bgMusic = document.getElementById('bgMusic');

let score = Number(localStorage.getItem('score')) || 0;
let level = Number(localStorage.getItem('level')) || 1;

scoreNum.textContent = score;
levelNum.textContent = level;

// Resize canvas
function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Music
let musicStarted = false;
canvas.addEventListener('pointerdown', () => {
  if(!musicStarted){ bgMusic.volume=0.3; bgMusic.play().catch(()=>{}); musicStarted=true; }
});

// Player lantern
let lantern = {x:canvas.width/2, y:canvas.height-60, size:25, speed:6};
let moveLeft=false, moveRight=false;
document.addEventListener('keydown', e=>{ if(e.key==='ArrowLeft') moveLeft=true; if(e.key==='ArrowRight') moveRight=true; });
document.addEventListener('keyup', e=>{ if(e.key==='ArrowLeft') moveLeft=false; if(e.key==='ArrowRight') moveRight=false; });

// Floating lanterns
class FloatingLantern {
  constructor(){
    this.x = Math.random()*(canvas.width-50)+25;
    this.y = Math.random()*canvas.height/2;
    this.size = 22;
    this.connected=false;
    this.text = generateRandomQuestion();
    this.floatOffset=Math.random()*Math.PI*2;
  }
  draw(){
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle=this.connected?'#00ffea':'#ff9f1c';
    ctx.shadowColor=ctx.fillStyle;
    ctx.shadowBlur=15;
    let floatY = this.y + Math.sin(Date.now()/500 + this.floatOffset)*5; // floating motion
    ctx.arc(this.x,floatY,this.size,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle='white';
    ctx.font='12px Poppins';
    ctx.textAlign='center';
    ctx.fillText(this.text.q,this.x,floatY+4);
    ctx.restore();
  }
}

// Generate simple question
function generateRandomQuestion(){
  const a=Math.floor(Math.random()*10+1);
  const b=Math.floor(Math.random()*10+1);
  return {q:`${a}+${b}`, a:a, b:b, ans:a+b};
}

let floatingLanterns=[];
for(let i=0;i<5;i++) floatingLanterns.push(new FloatingLantern());

// Animate game
function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Lantern movement
  if(moveLeft) lantern.x -= lantern.speed;
  if(moveRight) lantern.x += lantern.speed;
  lantern.x = Math.min(Math.max(lantern.x, lantern.size), canvas.width-lantern.size);

  // Draw player lantern
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle="#ff9f1c";
  ctx.shadowColor="#ff9f1c";
  ctx.shadowBlur=20;
  ctx.arc(lantern.x, lantern.y, lantern.size,0,Math.PI*2);
  ctx.fill();
  ctx.restore();

  // Draw and check floating lanterns
  floatingLanterns.forEach(f=>{
    f.draw();
    let dx=f.x-lantern.x;
    let dy=(f.y + Math.sin(Date.now()/500 + f.floatOffset)*5) - lantern.y;
    if(Math.hypot(dx,dy)<lantern.size+f.size && !f.connected){
      score+=1;
      f.connected=true;
      scoreNum.textContent=score;
      localStorage.setItem('score',score);
      if(score%5===0){
        level++;
        levelNum.textContent=level;
        localStorage.setItem('level',level);
        // Add more lanterns as difficulty
        floatingLanterns.push(new FloatingLantern());
        if(level===5 && localStorage.getItem('adsRemoved')!=='true'){
          paypalContainer.classList.remove('hidden');
          setupPayPal();
        }
      }
    }
  });

  requestAnimationFrame(animate);
}
animate();

// PayPal unlock
function setupPayPal(){
  if(!window.paypal) return;
  paypal.Buttons({
    style:{layout:'vertical',color:'gold',shape:'rect',label:'paypal'},
    createOrder:(data,actions)=>actions.order.create({purchase_units:[{description:"Unlock Ad-Free Mode", amount:{value:"10.00"}}]}),
    onApprove:(data,actions)=>actions.order.capture().then(()=>{
      localStorage.setItem('adsRemoved','true');
      paypalContainer.classList.add('hidden');
      unlockMsg.classList.remove('hidden');
      adBar.style.display='none';
    }),
    onError:(err)=>console.error(err)
  }).render('#paypal-button-container');
}
