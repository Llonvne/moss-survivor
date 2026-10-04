import type Phaser from 'phaser';

const palette:Record<string,string>={'.':'',o:'#102724',g:'#519566',G:'#85bd70',l:'#c2e69b',d:'#325943',b:'#658abb',B:'#9dc0df',p:'#ab82d1',P:'#d8b3ed',w:'#f4eccc',s:'#dab484',r:'#b87861',R:'#f0aa76',y:'#f3cd77',t:'#706146',T:'#a19063',e:'#1c2031'};
const patterns:Record<string,string[]>={
  hero:['.......gg.......','......gllg......','.....glllg......','....gllGgg......','...ggGGGggg.....','..gggggggggg....','.GGGGGGGGGGGG...','....ssssss......','....soosss...y..','....sssss....t..','...ggGGggg...t..','..gGGllGGgg..t..','..gGlGlGGggsst..','...gGGGGGg...t..','...ggGGggg...t..','...gGGGGGg......','....dd.dd.......','...ooo.ooo......'],
  slime:['....gggg....','..ggGGGGgg..','.gGGllllGGg.','gGGllGGGGGGg','gGGGoGGGoGGg','gGGGoGGGoGGg','gGGGGGGGGGGg','.ggGGGGGGgg.','..gggggggg..'],
  bat:['p..........p','pp........pp','pPp..pp..pPp','pPPppPPppPPp','.pPPPePPPPp.','..ppwPPwpp..','....pPPp....','.....pp.....'],
  brute:['...rrrrrr...','..rRRRRRRr..','.rRRyyRRRRr.','rRRRRRRRRRRr','rRReRRReRRRr','rRReRRReRRRr','.rRRRRRRRRr.','..rRRRRRRr..','.rrRRRRRRrr.','rRRrRRRRrRRr','rRRrRRRRrRRr','.rrRRRRRRrr.','..rrr..rrr..','..ooo..ooo..'],
  boss:['..ggg........ggg..','.gGGg..gggg..gGGg.','gGllGggGGGGggGllGg','gGGGGGGGGGGGGGGGGg','.ggGGGGGGGGGGGGgg.','..gGGGGGGGGGGGGg..','...ttTTTTTTtttt...','...tTTTTTTTTTTt...','..ttTyTTTTTyTTtt..','..tTTyTTTTTyTTTt..','.ttTTTTTTTTTTTTtt.','ttTTTTTttttTTTTTtt','tTTttTTttttTTttTTt','tTTttTTTTTTTTttTTt','.ttttTTTTTTTTtttt.','....tTTTTTTTTt....','....ttTTttTTtt....','...ttTTt..tTTtt...','...oooo....oooo...'],
  gem:['..b..','.bBb.','bBwBb','.bBb.','..b..'],
  bolt:['..y..','.ywy.','ywwwy','.ywy.','..y..'],
  thorn:['.r.','rRr','.r.'],
  flower:['..y..','.wyw.','..y..','..d..','.dd..'],
  rock:['...dddd...','..dTTTTd..','.dTTTTTTd.','dTTTttTTTd','dTTttttTTd','.dddddddd.'],
  grass:['..g...g.','g.g..gg.','ggg.ggg.','.ggggg..'],
};
export function createArt(scene:Phaser.Scene){
  for(const [name,rows] of Object.entries(patterns)){
    const texture=scene.textures.createCanvas(name,Math.max(...rows.map(r=>r.length)),rows.length)!;
    const ctx=texture.context;
    rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(palette[c]){ctx.fillStyle=palette[c];ctx.fillRect(x,y,1,1);}}));texture.refresh();
  }
  const tile=scene.textures.createCanvas('ground',128,128)!;const c=tile.context;
  c.fillStyle='#203c30';c.fillRect(0,0,128,128);
  let seed=417;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<390;i++){c.fillStyle=['#254334','#284635','#1d392e','#2d4a36'][Math.floor(rand()*4)];c.fillRect(Math.floor(rand()*64)*2,Math.floor(rand()*64)*2,2+Math.floor(rand()*3),2);}
  tile.refresh();
}
