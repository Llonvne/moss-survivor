import Phaser from 'phaser';
import { Run, UPGRADES, type Vec } from './model';
import { Meadow } from './scene';
import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML=`
  <header class="top"><div class="brand"><img src="/favicon.svg" alt=""><div><h1>苔原幸存者</h1><small>MOSS SURVIVOR</small></div></div><div class="top-right"><span class="edition">THE MEADOW · 01</span><button id="sound" class="icon-button" aria-label="开启音效" aria-pressed="false">音效 关</button><button id="pause" class="icon-button" disabled>暂停 Ⅱ</button></div></header>
  <main class="game-shell" aria-label="游戏区域"><div id="game"></div><div class="vignette"></div>
    <div class="hud"><div class="health"><div class="health-top"><span><span class="heart">♥</span>生命</span><span id="hp-text">100 / 100</span></div><div class="bar" role="meter" aria-label="生命值" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" id="hp-meter"><i id="hp-bar" style="width:100%"></i></div></div><div class="time"><strong id="timer">00:00</strong><span id="objective">存活至 05:00</span></div><div class="kill-panel"><span>击败</span><strong id="kills">0</strong></div></div>
    <div class="bossbar" id="bossbar" hidden><span>古木守卫</span><div class="bar"><i id="boss-hp"></i></div></div>
    <div class="level"><b id="level">LV. 1</b><span id="xp-text">0 / 10 经验</span></div><div class="arena-label">萤火草地<small>THE FIREFLY MEADOW</small></div>
    <div class="xp-row"><i id="xp-bar" style="width:0%"></i></div>
    <div id="joystick" aria-label="拖动摇杆移动角色"><div id="stick"></div></div>
    <div id="overlay" class="overlay" role="dialog" aria-modal="true" aria-labelledby="panel-title"></div>
  </main>
  <div class="bottom"><div class="loadout" id="loadout"><span class="loadout-label">当前构筑</span><div class="slot" title="星火法杖">✦</div><div class="slot empty">+</div><div class="slot empty">+</div><div class="slot empty">+</div></div><div class="help"><span class="keyboard-hint"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / 方向键 移动　<kbd>ESC</kbd> 暂停<br></span><span class="touch-hint">拖动左下摇杆移动<br></span>自动攻击 · 拾取蓝色晶石升级</div></div><div class="footer-note">一束星火，一片草地，再来一局。</div>`;

const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id)! as T;
const run=new Run();const move:Vec={x:0,y:0};const overlay=$('overlay');
let sound=false,audio:AudioContext|undefined,shown='',lastUi=0,lastKills=0,game:Phaser.Game|undefined;
let joystickPointer:number|null=null;
const formatTime=(seconds:number)=>`${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;
function tone(frequency:number,duration=.06){
  if(!sound)return;
  try{audio??=new AudioContext();void audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(frequency,audio.currentTime);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{sound=false;updateSound();}
}
function updateSound(){const b=$<HTMLButtonElement>('sound');b.textContent=`音效 ${sound?'开':'关'}`;b.setAttribute('aria-pressed',String(sound));b.setAttribute('aria-label',sound?'关闭音效':'开启音效');}
function resetInput(){move.x=0;move.y=0;joystickPointer=null;$('stick').style.transform='';}
function start(){resetInput();run.start();lastKills=0;shown='';tone(520,.12);refresh(true);}
function pause(){resetInput();run.pause();refresh(true);}
function resume(){resetInput();run.resume();refresh(true);}
function choose(id:string){run.chooseUpgrade(id);resetInput();shown='';tone(740,.15);renderLoadout();refresh(true);}
function renderLoadout(){
  const entries=Object.entries(run.upgrades);
  $('loadout').innerHTML='<span class="loadout-label">当前构筑</span><div class="slot" title="星火法杖">✦</div>'+entries.map(([id,n])=>{const u=UPGRADES.find(x=>x.id===id)!;return `<div class="slot" style="color:${u.color}" title="${u.name} ×${n}">${u.icon}<small>${n}</small></div>`;}).join('')+Array.from({length:Math.max(0,3-entries.length)},()=>'<div class="slot empty">+</div>').join('');
}
function showPanel(){
  resetInput();const state=run.status;
  overlay.hidden=state==='playing';
  if(overlay.hidden){overlay.innerHTML='';return;}
  if(state==='ready'){
    overlay.innerHTML=`<section class="panel"><div class="eyebrow">一场五分钟的森林冒险</div><img class="hero-icon" id="hero-preview" alt="像素小法师"><h2 id="panel-title">让星火<em>生生不息</em></h2><p>走位躲避怪物，法杖会自动出击。<br>收集晶石、选择成长，击败苏醒的古木守卫。</p><button class="primary" id="start">进入草地</button><span class="fine">单局约 5 分钟 · 随机升级 · 倒下就再来</span></section>`;
    const texture=game?.textures.get('hero');if(texture?.key==='hero')$<HTMLImageElement>('hero-preview').src=game!.textures.getBase64('hero');
    $('start').onclick=()=>{start();renderLoadout();};
  }else if(state==='paused'){
    overlay.innerHTML=`<section class="panel"><div class="eyebrow">让萤火等一会儿</div><h2 id="panel-title">稍作休息</h2><p>战斗已暂停。准备好了就继续。</p><button class="primary" id="resume">继续冒险</button><button class="secondary" id="restart">重新开始本局</button></section>`;
    $('resume').onclick=resume;$('restart').onclick=()=>{start();renderLoadout();};
  }else if(state==='upgrade'){
    overlay.innerHTML=`<section class="panel wide"><div class="eyebrow">LEVEL ${run.level} · 森林的馈赠</div><h2 id="panel-title">选择你的成长</h2><p>三选一，效果持续本局。战斗已暂停。</p><div class="choices">${run.choices.map((u,i)=>`<button class="choice" data-upgrade="${u.id}" aria-label="${u.name}，${u.description}"><span class="glyph" style="color:${u.color}">${u.icon}</span><strong>${u.name}</strong><small>${u.description}</small></button>`).join('')}</div></section>`;
    overlay.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach(b=>b.onclick=()=>choose(b.dataset.upgrade!));tone(620,.12);
  }else{
    const win=state==='won';
    overlay.innerHTML=`<section class="panel"><div class="eyebrow">${win?'THE MEADOW IS SAFE':'THE FOREST REMEMBERS'}</div><h2 id="panel-title">${win?'星火<em>照亮森林</em>':'星火暂时<em>熄灭</em>'}</h2><p>${win?'古木守卫已倒下。这片草地记住了你。':'每次倒下，都是下一次冒险的开始。'}</p><div class="stats"><div><strong>${formatTime(run.elapsed)}</strong><span>存活时间</span></div><div><strong>${run.kills}</strong><span>击败怪物</span></div><div><strong>${run.level}</strong><span>最终等级</span></div></div><button class="primary" id="restart">再来一局</button></section>`;
    $('restart').onclick=()=>{start();renderLoadout();};tone(win?820:170,.22);
  }
  overlay.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});
}
function refresh(force=false){
  if(run.status!==shown){shown=run.status;showPanel();force=true;}
  const now=performance.now();if(!force&&now-lastUi<80)return;lastUi=now;
  const p=run.player;$('hp-text').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;$('hp-bar').style.width=`${p.hp/p.maxHp*100}%`;
  $('hp-meter').setAttribute('aria-valuenow',String(Math.ceil(p.hp)));$('hp-meter').setAttribute('aria-valuemax',String(p.maxHp));
  $('timer').textContent=formatTime(run.elapsed);$('kills').textContent=String(run.kills);$('level').textContent=`LV. ${run.level}`;
  $('xp-text').textContent=`${run.xp} / ${run.requiredXp} 经验`;$('xp-bar').style.width=`${Math.min(100,run.xp/run.requiredXp*100)}%`;
  const b=run.boss;$('bossbar').hidden=!b;if(b)$('boss-hp').style.width=`${b.hp/b.maxHp*100}%`;
  $('objective').textContent=run.bossDefeated?'守卫已击败 · 坚持至 05:00':run.bossSpawned?'击败古木守卫':'存活至 05:00';
  const pauseButton=$<HTMLButtonElement>('pause');pauseButton.disabled=!['playing','paused'].includes(run.status);pauseButton.textContent=run.status==='paused'?'继续 ▷':'暂停 Ⅱ';
  $('joystick').style.visibility=run.status==='playing'?'visible':'hidden';
  if(run.kills>lastKills)tone(350+Math.random()*130);lastKills=run.kills;
}
$('sound').onclick=()=>{sound=!sound;updateSound();tone(500);};
$('pause').onclick=()=>run.status==='paused'?resume():pause();
document.addEventListener('keydown',e=>{
  if(e.code==='Escape'){e.preventDefault();run.status==='paused'?resume():pause();}
  if(e.code==='Tab'&&!overlay.hidden){const buttons=[...overlay.querySelectorAll<HTMLButtonElement>('button')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('blur',pause);
const joystick=$('joystick');
function drag(e:PointerEvent){
  if(e.pointerId!==joystickPointer)return;const r=joystick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,n=Math.max(34,Math.hypot(x,y));
  move.x=x/n;move.y=y/n;$('stick').style.transform=`translate(${move.x*34}px,${move.y*34}px)`;
}
joystick.addEventListener('pointerdown',e=>{if(run.status!=='playing'||joystickPointer!==null)return;e.preventDefault();joystickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);drag(e);});
joystick.addEventListener('pointermove',drag);
for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,resetInput);
const shell=document.querySelector<HTMLElement>('.game-shell')!;
game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:Math.round(shell.clientWidth/2),height:Math.round(shell.clientHeight/2),pixelArt:true,roundPixels:true,antialias:false,backgroundColor:'#203c30',audio:{noAudio:true},scene:new Meadow(run,()=>move,()=>refresh()),scale:{mode:Phaser.Scale.NONE},banner:false});
new ResizeObserver(()=>{resetInput();game?.scale.resize(Math.round(shell.clientWidth/2),Math.round(shell.clientHeight/2));}).observe(shell);
renderLoadout();

// Optional browser tools share the exact actions used by the visible controls.
type Tool={name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean};execute:(input:Record<string,unknown>)=>unknown};
const context=(document as Document & {modelContext?:{registerTool:(tool:Tool,options:{signal:AbortSignal})=>unknown}}).modelContext;
if(context?.registerTool){
  const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const state=()=>({status:run.status,elapsed:Math.floor(run.elapsed),level:run.level,hp:Math.ceil(run.player.hp),kills:run.kills,position:{x:Math.round(run.player.x),y:Math.round(run.player.y)},choices:run.choices.map(u=>({id:u.id,name:u.name,description:u.description}))});
  const tools:Tool[]=[
    {name:'get_run_status',description:'读取当前冒险的时间、生命、位置与待选升级。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:state},
    {name:'pause_run',description:'暂停当前战斗。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute:()=>{if(run.status!=='playing')throw new Error('当前不在战斗中');pause();return state();}},
    {name:'choose_upgrade',description:'选择当前三选一面板中的一项升级并继续战斗。',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false},execute:(input)=>{if(typeof input.id!=='string')throw new Error('需要升级 id');choose(input.id);return state();}},
  ];
  for(const tool of tools){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Normal play remains available when the proposed API is unsupported. */}}
}
