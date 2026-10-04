export type Vec = { x: number; y: number };
export type Status = 'ready' | 'playing' | 'paused' | 'upgrade' | 'dead' | 'won';
export type Kind = 'slime' | 'bat' | 'brute' | 'boss';
export type Enemy = Vec & { id: number; kind: Kind; hp: number; maxHp: number; speed: number; radius: number; hit: number; attack: number };
export type Bolt = Vec & { id: number; vx: number; vy: number; life: number; damage: number; pierce: number; hits: Set<number>; hostile: boolean };
export type Gem = Vec & { id: number; value: number };
export type Effect = Vec & { id: number; life: number; text: string; color: string };
export type Upgrade = { id: string; name: string; description: string; icon: string; color: string };
export const UPGRADES: Upgrade[] = [
  {id:'power',name:'炽烈法术',description:'弹丸伤害 +30%',icon:'✦',color:'#ffb46b'},
  {id:'haste',name:'疾风咏唱',description:'攻击间隔缩短 15%',icon:'ϟ',color:'#bdf386'},
  {id:'multi',name:'分裂星火',description:'每次攻击多发射 1 枚弹丸',icon:'⋔',color:'#d9b8ff'},
  {id:'pierce',name:'穿透之光',description:'弹丸额外穿透 1 个敌人',icon:'➶',color:'#8adced'},
  {id:'speed',name:'轻盈步伐',description:'移动速度 +12%，恢复 10 生命',icon:'»',color:'#d9eaa2'},
  {id:'heart',name:'生命萌芽',description:'最大生命 +25，恢复 40 生命',icon:'♥',color:'#ff8ba8'},
  {id:'magnet',name:'萤火引力',description:'经验吸取范围 +35%',icon:'◈',color:'#8de1b4'},
  {id:'regen',name:'森林祝福',description:'每秒恢复 0.6 生命',icon:'✚',color:'#a6da7c'},
];
const length = (v: Vec) => Math.hypot(v.x,v.y);
const distance = (a: Vec,b: Vec) => Math.hypot(a.x-b.x,a.y-b.y);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo,Math.min(hi,v));

export class Run {
  status: Status='ready'; elapsed=0; level=1; xp=0; kills=0; bossSpawned=false; bossDefeated=false;
  enemies: Enemy[]=[]; bolts: Bolt[]=[]; gems: Gem[]=[]; effects: Effect[]=[]; choices: Upgrade[]=[];
  upgrades: Record<string,number>={}; player=this.newPlayer(); bounds=1100;
  private random:()=>number; private id=0; private shotClock=0; private spawnClock=0.65; private bossClock=2;
  constructor(random:()=>number=Math.random){this.random=random;}
  private newPlayer(){return {x:0,y:0,hp:100,maxHp:100,speed:112,damage:18,interval:.62,projectiles:1,pierce:0,magnet:55,regen:0,invincible:0,facing:1};}
  get requiredXp(){return 10+(this.level-1)*7;}
  get boss(){return this.enemies.find(e=>e.kind==='boss');}
  start(){
    this.status='playing'; this.elapsed=0; this.level=1; this.xp=0; this.kills=0;
    this.bossSpawned=false; this.bossDefeated=false; this.enemies=[]; this.bolts=[]; this.gems=[]; this.effects=[];
    this.choices=[]; this.upgrades={}; this.player=this.newPlayer(); this.id=0; this.shotClock=0; this.spawnClock=.65; this.bossClock=2;
  }
  pause(){if(this.status==='playing')this.status='paused';}
  resume(){if(this.status==='paused')this.status='playing';}
  addXp(value:number){
    this.xp+=value;
    if(this.status==='playing' && this.xp>=this.requiredXp)this.levelUp();
  }
  private levelUp(){
    this.xp-=this.requiredXp; this.level++; this.status='upgrade';
    const pool=UPGRADES.filter(u=>u.id!=='multi'||this.player.projectiles<7);
    this.choices=[];
    while(this.choices.length<3){const i=Math.floor(this.random()*pool.length); this.choices.push(pool.splice(i,1)[0]);}
  }
  chooseUpgrade(id:string){
    if(this.status!=='upgrade'||!this.choices.some(u=>u.id===id))throw new Error('请选择当前升级选项');
    const p=this.player; this.upgrades[id]=(this.upgrades[id]||0)+1;
    switch(id){
      case 'power':p.damage*=1.3;break;
      case 'haste':p.interval=Math.max(.12,p.interval*.85);break;
      case 'multi':p.projectiles++;break;
      case 'pierce':p.pierce++;break;
      case 'speed':p.speed*=1.12;p.hp=Math.min(p.maxHp,p.hp+10);break;
      case 'heart':p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+40);break;
      case 'magnet':p.magnet*=1.35;break;
      case 'regen':p.regen+=.6;break;
    }
    this.choices=[];this.status='playing';
    if(this.xp>=this.requiredXp)this.levelUp();
  }
  spawn(kind:Kind,x?:number,y?:number){
    const range=340;
    let sx=0,sy=0,valid=false;
    for(let attempt=0;attempt<12;attempt++){
      const a=this.random()*Math.PI*2;sx=this.player.x+Math.cos(a)*range;sy=this.player.y+Math.sin(a)*range;
      if(Math.abs(sx)<=this.bounds&&Math.abs(sy)<=this.bounds){valid=true;break;}
    }
    if(!valid){const a=Math.atan2(-this.player.y,-this.player.x);sx=this.player.x+Math.cos(a)*range;sy=this.player.y+Math.sin(a)*range;}
    const spec={slime:[30,27,9,9],bat:[20,57,7,7],brute:[100,22,13,16],boss:[3600,26,27,24]}[kind];
    const hp=spec[0]*(kind==='boss'?1:1+this.elapsed/400);
    const e:Enemy={id:++this.id,kind,x:x??sx,y:y??sy,hp,maxHp:hp,speed:spec[1],radius:spec[2],hit:0,attack:spec[3]};
    this.enemies.push(e);return e;
  }
  private effect(x:number,y:number,text:string,color:string){this.effects.push({id:++this.id,x,y,text,color,life:.65});}
  private hurt(damage:number){
    if(this.player.invincible>0)return;
    this.player.hp=Math.max(0,this.player.hp-damage);this.player.invincible=.8;
    this.effect(this.player.x,this.player.y-15,'−'+damage,'#ff9393');
    if(this.player.hp<=0)this.status='dead';
  }
  update(rawDt:number,input:Vec){
    if(this.status!=='playing')return;
    if(this.player.hp<=0){this.status='dead';return;}
    const dt=clamp(rawDt,0,.1),p=this.player;
    this.elapsed+=dt; p.invincible=Math.max(0,p.invincible-dt);p.hp=Math.min(p.maxHp,p.hp+p.regen*dt);
    const n=Math.max(1,length(input));p.x=clamp(p.x+input.x/n*p.speed*dt,-this.bounds,this.bounds);p.y=clamp(p.y+input.y/n*p.speed*dt,-this.bounds,this.bounds);
    if(input.x)p.facing=input.x>0?1:-1;
    this.spawnClock-=dt;
    if(this.spawnClock<=0&&this.enemies.length<160){
      this.spawnClock=Math.max(.17,1.05-this.elapsed*.003);
      const roll=this.random();this.spawn(this.elapsed>50&&roll<.2?'brute':this.elapsed>18&&roll<.5?'bat':'slime');
    }
    if(this.elapsed>=255&&!this.bossSpawned){this.spawn('boss');this.bossSpawned=true;this.effect(p.x,p.y-50,'古木守卫苏醒','#ffb46b');}
    this.shotClock-=dt;
    if(this.shotClock<=0&&this.enemies.length){
      let target=this.enemies[0];for(const e of this.enemies)if(distance(e,p)<distance(target,p))target=e;
      const angle=Math.atan2(target.y-p.y,target.x-p.x);this.shotClock=p.interval;
      for(let i=0;i<p.projectiles;i++){
        const a=angle+(i-(p.projectiles-1)/2)*.14;
        this.bolts.push({id:++this.id,x:p.x,y:p.y-3,vx:Math.cos(a)*320,vy:Math.sin(a)*320,life:1.7,damage:p.damage,pierce:p.pierce,hits:new Set(),hostile:false});
      }
    }
    for(const e of this.enemies){
      const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
      e.x+=dx/d*e.speed*dt;e.y+=dy/d*e.speed*dt;e.hit=Math.max(0,e.hit-dt);
      if(distance(e,p)<e.radius+7)this.hurt(e.attack);
    }
    const boss=this.boss;
    if(boss){
      this.bossClock-=dt;
      if(this.bossClock<=0){
        this.bossClock=boss.hp<boss.maxHp*.5?1.5:2.4;
        const base=Math.atan2(p.y-boss.y,p.x-boss.x);
        for(let i=0;i<12;i++){
          const a=base+i*Math.PI/6;
          this.bolts.push({id:++this.id,x:boss.x,y:boss.y,vx:Math.cos(a)*80,vy:Math.sin(a)*80,life:5,damage:14,pierce:0,hits:new Set(),hostile:true});
        }
      }
    }
    for(const b of this.bolts){
      b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      if(b.hostile){if(distance(b,p)<10){this.hurt(b.damage);b.life=0;}continue;}
      for(const e of this.enemies){
        if(e.hp<=0||b.life<=0||b.hits.has(e.id))continue;
        if(distance(e,b)<e.radius+5){
          e.hp-=b.damage;e.hit=.09;b.hits.add(e.id);this.effect(e.x,e.y-e.radius,''+Math.round(b.damage),'#f7efc8');
          if(b.pierce--<=0)b.life=0;
          if(e.hp<=0){
            this.kills++;if(e.kind==='boss'){this.bossDefeated=true;this.effect(e.x,e.y,'守卫已击败','#c4f48c');}
            this.gems.push({id:++this.id,x:e.x,y:e.y,value:e.kind==='boss'?45:e.kind==='brute'?5:2});
          }
        }
      }
    }
    this.enemies=this.enemies.filter(e=>e.hp>0&&(e.kind==='boss'||distance(e,p)<850));
    this.bolts=this.bolts.filter(b=>b.life>0);
    for(const g of this.gems){
      const d=distance(g,p);
      if(d<p.magnet){const t=Math.min(1,(170*dt)/(d||1));g.x+=(p.x-g.x)*t;g.y+=(p.y-g.y)*t;}
      if(distance(g,p)<13){this.addXp(g.value);g.value=0;}
    }
    this.gems=this.gems.filter(g=>g.value>0);
    if(this.gems.length>350){const old=this.gems.shift()!;this.gems[0].value+=old.value;}
    for(const e of this.effects){e.life-=dt;e.y-=16*dt;}this.effects=this.effects.filter(e=>e.life>0).slice(-90);
    if(this.status==='playing'&&this.elapsed>=300&&this.bossDefeated)this.status='won';
  }
}
