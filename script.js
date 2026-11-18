(() => {
  "use strict";
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("gameOverlay");
  const startBtn = document.getElementById("startBtn");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const stateLabel = document.getElementById("stateLabel");
  const scoreEl = document.getElementById("score");
  const shardsEl = document.getElementById("shards");
  const bestEl = document.getElementById("best");
  const levelEl = document.getElementById("level");
  const livesEl = document.getElementById("lives");
  const damageFlash = document.getElementById("damageFlash");
  const comboPop = document.getElementById("comboPop");
  const canvasWrap = document.querySelector(".canvas-wrap");
  const recordScore = document.getElementById("recordScore");
  const recordBar = document.getElementById("recordBar");
  document.getElementById("year").textContent = new Date().getFullYear();

  let width = 900, height = 420, dpr = 1, running = false, gameOver = false;
  let lastTime = 0, elapsed = 0, score = 0, shards = 0, best = 0, spawnTimer = 0, shardTimer = 0;
  let lives = 3, invulnerable = 0, combo = 0, comboTimer = 0, screenShake = 0;
  let hazards = [], pickups = [], particles = [], stars = [], keys = {}, pointerX = null;
  let player = { x: 0, y: 0, r: 10, speed: 350, trail: [] };
  try { best = Number(localStorage.getItem("neonRiftBest") || 0); } catch (_) { best = 0; }
  updateBest();

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(300, rect.width);
    height = Math.max(300, rect.height);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    player.y = height - 55;
    if (!running) player.x = width / 2;
    stars = Array.from({length: Math.floor(width * height / 4500)}, () => ({
      x: Math.random()*width, y: Math.random()*height, size: Math.random()*1.7+.3,
      speed: Math.random()*25+8, alpha: Math.random()*.55+.15
    }));
    draw();
  }
  window.addEventListener("resize", resize);

  function updateBest() {
    bestEl.textContent = String(best).padStart(5, "0");
    recordScore.textContent = String(best).padStart(5, "0");
    recordBar.style.width = Math.min(100, best / 2500 * 100) + "%";
  }
  function reset() {
    elapsed = 0; score = 0; shards = 0; lives = 3; invulnerable = 0; combo = 0; comboTimer = 0; screenShake = 0;
    spawnTimer = .35; shardTimer = 1.2;
    hazards = []; pickups = []; particles = [];
    player.x = width/2; player.y = height-55; player.trail = [];
    scoreEl.textContent = "00000"; shardsEl.textContent = "00"; levelEl.textContent = "01";
    livesEl.textContent = "♥ ♥ ♥"; livesEl.style.color = "#ff6c91";
    startBtn.innerHTML = 'START RUN <span>→</span>';
  }
  function start() {
    reset(); running = true; gameOver = false; lastTime = performance.now();
    overlay.classList.add("hidden"); stateLabel.textContent = "RIFT ACTIVE";
    requestAnimationFrame(loop);
  }
  function endRun() {
    running = false; gameOver = true;
    const finalScore = Math.floor(score);
    const previousBest = best;
    if (finalScore > best) {
      best = finalScore;
      try { localStorage.setItem("neonRiftBest", String(best)); } catch (_) {}
      updateBest();
    }
    stateLabel.textContent = "RUN TERMINATED";
    overlayTitle.innerHTML = finalScore > previousBest ? 'NEW <span class="gradient-text">RECORD!</span>' : 'RIFT <span class="gradient-text">COLLISION.</span>';
    overlayText.textContent = `All 3 lives spent. Final score: ${String(finalScore).padStart(5,"0")} · Energy shards: ${shards}. ${finalScore > previousBest ? "NEW PERSONAL BEST! The rift remembers your name." : "Recharge, pilot. The rift is waiting for a rematch."}`;
    startBtn.innerHTML = 'RUN IT BACK <span>↻</span>';
    overlay.classList.remove("hidden");
    burst(player.x, player.y, "#ff527b", 26);
    draw();
  }
  startBtn.addEventListener("click", start);

  function spawnHazard() {
    const r = 9 + Math.random()*12;
    hazards.push({x: 20 + Math.random()*(width-40), y: -r-5, r, speed: 125 + Math.min(210, elapsed*4) + Math.random()*55, rot: Math.random()*6, spin: (Math.random()-.5)*3});
  }
  function spawnPickup() {
    pickups.push({x: 22 + Math.random()*(width-44), y:-20, r:8, speed:115 + Math.min(170,elapsed*3), phase:Math.random()*6});
  }
  function burst(x,y,color,count) {
    for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=35+Math.random()*190;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+Math.random()*.65,max:.9,color,size:1+Math.random()*2.5});}
  }
  function loseLife(hazard) {
    if (invulnerable > 0) return;
    lives = Math.max(0, lives - 1);
    livesEl.textContent = "♥ ".repeat(lives).trim() + (lives < 3 ? " ♡".repeat(3-lives) : "");
    livesEl.style.color = lives === 1 ? "#ff527b" : "#ff8ba9";
    invulnerable = 1.35; screenShake = .24; combo = 0; comboTimer = 0;
    burst(player.x, player.y, "#ff527b", 24);
    damageFlash.classList.remove("hit"); void damageFlash.offsetWidth; damageFlash.classList.add("hit");
    canvasWrap.classList.remove("shake"); void canvasWrap.offsetWidth; canvasWrap.classList.add("shake");
    hazard.y = height + hazard.r + 30;
    if (lives <= 0) endRun();
    else stateLabel.textContent = `DAMAGE TAKEN · ${lives} ${lives === 1 ? "LIFE" : "LIVES"} LEFT`;
  }
  function movePlayer(dt) {
    let direction = 0;
    if (keys.ArrowLeft || keys.a || keys.A) direction -= 1;
    if (keys.ArrowRight || keys.d || keys.D) direction += 1;
    if (pointerX !== null) {
      const dx = pointerX - player.x;
      player.x += Math.max(-player.speed*dt, Math.min(player.speed*dt, dx));
    } else player.x += direction * player.speed * dt;
    player.x = Math.max(13, Math.min(width-13, player.x));
    player.trail.push({x:player.x,y:player.y,life:.22});
    if(player.trail.length>8) player.trail.shift();
    player.trail.forEach(p=>p.life-=dt);
    player.trail=player.trail.filter(p=>p.life>0);
  }
  function update(dt) {
    elapsed += dt;
    score += dt * (12 + Math.min(24, elapsed*.45));
    const level = 1 + Math.floor(elapsed/15);
    levelEl.textContent = String(level).padStart(2,"0");
    spawnTimer -= dt;
    if(spawnTimer<=0){spawnHazard();spawnTimer=Math.max(.22,.92-elapsed*.009)*(.65+Math.random()*.7);}
    shardTimer -= dt;
    if(shardTimer<=0){spawnPickup();shardTimer=1.05+Math.random()*1.2;}
    movePlayer(dt);
    hazards.forEach(h=>{h.y+=h.speed*dt;h.rot+=h.spin*dt;});
    pickups.forEach(p=>{p.y+=p.speed*dt;p.phase+=dt*4;});
    hazards=hazards.filter(h=>h.y<height+h.r+10);
    pickups=pickups.filter(p=>p.y<height+20);
    stars.forEach(s=>{s.y+=s.speed*dt;if(s.y>height){s.y=0;s.x=Math.random()*width;}});
    particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.98;p.vy*=.98;p.life-=dt;});
    particles=particles.filter(p=>p.life>0);
    for(const p of pickups){
      if(Math.hypot(p.x-player.x,p.y-player.y)<p.r+player.r+3){
        p.y=height+100; shards++; combo++; comboTimer=3.2;
        const multiplier = Math.min(5, 1 + Math.floor(combo/3));
        score += 100 * multiplier; burst(p.x,p.y,"#5ef4f0",16);
        if(combo >= 2){comboPop.textContent = combo >= 12 ? `RIFT GOD ×${multiplier}` : `SHARD STREAK ×${multiplier}`;comboPop.classList.remove("show");void comboPop.offsetWidth;comboPop.classList.add("show");}
      }
    }
    if (invulnerable > 0) invulnerable = Math.max(0, invulnerable - dt);
    if (comboTimer > 0) comboTimer -= dt; else combo = 0;
    if (screenShake > 0) screenShake = Math.max(0, screenShake - dt);
    for(const h of hazards){
      if(invulnerable <= 0 && Math.hypot(h.x-player.x,h.y-player.y)<h.r+player.r-2){loseLife(h);if(!running)return;}
    }
    scoreEl.textContent=String(Math.floor(score)).padStart(5,"0");
    shardsEl.textContent=String(shards).padStart(2,"0");
  }
  function polygon(x,y,r,sides,rotation,color,glow) {
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.beginPath();
    for(let i=0;i<sides;i++){const a=i*Math.PI*2/sides;const px=Math.cos(a)*r*(i%2?.78:1),py=Math.sin(a)*r*(i%2?.78:1);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
    ctx.closePath();ctx.shadowBlur=glow;ctx.shadowColor=color;ctx.fillStyle=color+"22";ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=color;ctx.stroke();ctx.restore();
  }
  function draw() {
    ctx.clearRect(0,0,width,height);
    ctx.save();
    if(screenShake > 0) ctx.translate((Math.random()-.5)*10,(Math.random()-.5)*8);
    const bg=ctx.createLinearGradient(0,0,0,height);bg.addColorStop(0,"#090c1b");bg.addColorStop(1,"#0b1022");ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    // Fine scanlines and subtle depth grid.
    ctx.strokeStyle="rgba(118,139,210,.055)";ctx.lineWidth=1;
    for(let y=0;y<height;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
    stars.forEach(s=>{ctx.globalAlpha=s.alpha;ctx.fillStyle="#d6eaff";ctx.fillRect(s.x,s.y,s.size,s.size);});ctx.globalAlpha=1;
    const glow=ctx.createRadialGradient(width/2,height*.55,0,width/2,height*.55,width*.48);glow.addColorStop(0,"rgba(74,57,170,.13)");glow.addColorStop(1,"rgba(9,12,27,0)");ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    pickups.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.phase);ctx.shadowBlur=18;ctx.shadowColor="#5ef4f0";ctx.strokeStyle="#5ef4f0";ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(0,-p.r);ctx.lineTo(p.r*.7,0);ctx.lineTo(0,p.r);ctx.lineTo(-p.r*.7,0);ctx.closePath();ctx.stroke();ctx.fillStyle="#5ef4f044";ctx.fill();ctx.restore();});
    hazards.forEach(h=>polygon(h.x,h.y,h.r,6,h.rot,"#ff527b",15));
    particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.shadowBlur=9;ctx.shadowColor=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);});ctx.globalAlpha=1;ctx.shadowBlur=0;
    player.trail.forEach(p=>{ctx.globalAlpha=p.life/.22*.35;ctx.fillStyle="#5ef4f0";ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
    // Player ship, drawn as original vector geometry.
    ctx.save();ctx.globalAlpha = invulnerable > 0 && Math.floor(invulnerable*14)%2===0 ? .28 : 1;ctx.translate(player.x,player.y);ctx.shadowBlur=18;ctx.shadowColor="#5ef4f0";ctx.fillStyle="#c8fffc";ctx.strokeStyle="#5ef4f0";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(10,10);ctx.lineTo(0,6);ctx.lineTo(-10,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle="#a78bfa";ctx.beginPath();ctx.arc(0,0,2.5,0,Math.PI*2);ctx.fill();ctx.restore();
    // Arena rails.
    ctx.strokeStyle="rgba(94,244,240,.18)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(8,height);ctx.moveTo(width-8,0);ctx.lineTo(width-8,height);ctx.stroke();
    ctx.restore();
  }
  function loop(now) {
    if(!running)return;
    const dt=Math.min(.035,(now-lastTime)/1000||0);lastTime=now;
    update(dt);draw();
    if(running)requestAnimationFrame(loop);
  }
  window.addEventListener("keydown",e=>{
    if(["ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();
    keys[e.key]=true;
    if((e.key===" "||e.key==="Enter")&&!running)start();
  });
  window.addEventListener("keyup",e=>{keys[e.key]=false;});
  canvas.addEventListener("pointerdown",e=>{
    const rect=canvas.getBoundingClientRect();
    pointerX=e.clientX-rect.left;
    if(!running&&!gameOver)start();
    else if(!running&&gameOver)start();
  });
  canvas.addEventListener("pointermove",e=>{
    if(e.buttons){const rect=canvas.getBoundingClientRect();pointerX=e.clientX-rect.left;}
  });
  canvas.addEventListener("pointerup",()=>{pointerX=null;});
  canvas.addEventListener("pointercancel",()=>{pointerX=null;});
  canvas.addEventListener("pointerleave",()=>{if(!running)pointerX=null;});
  resize();
  // Decorative stars also animate behind the standby overlay.
  function idleFrame(now){if(!running){const dt=Math.min(.05,(now-lastTime)/1000||.016);lastTime=now;stars.forEach(s=>{s.y+=s.speed*dt;if(s.y>height){s.y=0;s.x=Math.random()*width;}});draw();}requestAnimationFrame(idleFrame);}
  requestAnimationFrame(idleFrame);
})();