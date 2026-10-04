import Phaser from 'phaser';
import { Run, type Vec } from './model';
import { createArt } from './art';

export class Meadow extends Phaser.Scene {
  run:Run; private inputVector:()=>Vec; private onFrame:()=>void;
  private hero!:Phaser.GameObjects.Image;private shadow!:Phaser.GameObjects.Ellipse;
  private keys!:Record<string,Phaser.Input.Keyboard.Key>;private objects=new Map<number,Phaser.GameObjects.Image>();
  private labels=new Map<number,Phaser.GameObjects.Text>();private fireflies:Phaser.GameObjects.Rectangle[]=[];
  private lastHp=100;private ambient=0;
  constructor(run:Run,input:()=>Vec,onFrame:()=>void){super('meadow');this.run=run;this.inputVector=input;this.onFrame=onFrame;}
  create(){
    createArt(this);this.add.tileSprite(0,0,2400,2400,'ground');
    let seed=817;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    for(let i=0;i<950;i++){
      const x=(rand()-.5)*2320,y=(rand()-.5)*2320,key=rand()<.12?'rock':rand()<.2?'flower':'grass';
      this.add.image(x,y,key).setAlpha(key==='grass'?.5:.75).setDepth(-1);
    }
    const boundary=this.add.graphics();boundary.lineStyle(3,0x547148,.5);boundary.strokeRect(-1115,-1115,2230,2230);
    // A small stone ring makes the initial clearing recognizable.
    for(let i=0;i<12;i++){const a=i*Math.PI/6;this.add.image(Math.cos(a)*95,Math.sin(a)*66,'rock').setAlpha(.55);}
    for(let i=0;i<24;i++)this.fireflies.push(this.add.rectangle(rand()*640-320,rand()*400-200,2,2,0xd4efa0,.5).setDepth(5));
    this.shadow=this.add.ellipse(0,6,15,6,0x0a211c,.5).setDepth(1);
    this.hero=this.add.image(0,0,'hero').setDepth(4);
    this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string,Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);
    this.cameras.main.startFollow(this.hero,true,.13,.13);this.cameras.main.setBackgroundColor('#203c30');
    this.game.events.on(Phaser.Core.Events.BLUR,()=>{this.run.pause();this.input.keyboard?.resetKeys();this.onFrame();});
    this.onFrame();
  }
  update(time:number,delta:number){
    const p=this.run.player, touch=this.inputVector();
    const x=touch.x+(this.keys.D.isDown||this.keys.RIGHT.isDown?1:0)-(this.keys.A.isDown||this.keys.LEFT.isDown?1:0);
    const y=touch.y+(this.keys.S.isDown||this.keys.DOWN.isDown?1:0)-(this.keys.W.isDown||this.keys.UP.isDown?1:0);
    this.run.update(delta/1000,{x,y});
    const active=this.run.status==='playing';this.ambient+=active||this.run.status==='ready'?delta/1000:0;
    const bob=active&&(x||y)?Math.sin(time/65)*1.2:0;
    this.hero.setPosition(p.x,p.y+bob).setFlipX(p.facing<0).setAlpha(p.invincible>0&&Math.sin(time/35)>0?.4:1);
    this.shadow.setPosition(p.x,p.y+8);
    if(p.hp<this.lastHp)this.cameras.main.shake(100,.003);this.lastHp=p.hp;
    const current=new Set<number>();
    const sync=(id:number,key:string,x:number,y:number,scale=1,alpha=1,tint=0xffffff)=>{
      current.add(id);let obj=this.objects.get(id);if(!obj){obj=this.add.image(x,y,key);this.objects.set(id,obj);}
      obj.setTexture(key).setPosition(x,y).setScale(scale).setAlpha(alpha).setTint(tint).setDepth(key==='gem'?2:3);return obj;
    };
    for(const e of this.run.enemies){sync(e.id,e.kind,e.x,e.y+Math.sin(this.ambient*7+e.id)*1.2,e.kind==='boss'?2:1,1,e.hit>0?0xffebbb:0xffffff).setFlipX(e.x>p.x);}
    for(const g of this.run.gems)sync(g.id,'gem',g.x,g.y+Math.sin(this.ambient*4+g.id)*1.2);
    for(const b of this.run.bolts)sync(b.id,b.hostile?'thorn':'bolt',b.x,b.y,b.hostile?1.6:1).setRotation(Math.atan2(b.vy,b.vx));
    for(const [id,obj]of this.objects){if(!current.has(id)){obj.destroy();this.objects.delete(id);}}
    const effects=new Set<number>();
    for(const e of this.run.effects){effects.add(e.id);let label=this.labels.get(e.id);if(!label){label=this.add.text(e.x,e.y,e.text,{fontFamily:'monospace',fontSize:'9px',color:e.color,stroke:'#17372b',strokeThickness:2}).setOrigin(.5).setDepth(10);this.labels.set(e.id,label);}label.setPosition(e.x,e.y).setAlpha(Math.min(1,e.life*3));}
    for(const [id,label]of this.labels){if(!effects.has(id)){label.destroy();this.labels.delete(id);}}
    this.fireflies.forEach((f,i)=>{const a=this.ambient*.2+i;f.setPosition(p.x+Math.sin(a*1.31)*280,p.y+Math.cos(a*.73)*180).setAlpha(.2+Math.sin(a*4)**2*.5);});
    this.onFrame();
  }
}
