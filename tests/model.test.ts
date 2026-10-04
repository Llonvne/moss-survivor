import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Run } from '../src/model.ts';

test('run starts clean and movement is normalized', () => {
  const r = new Run(() => 0.5); r.start(); const x = r.player.x, y = r.player.y;
  r.update(0.1, {x:1,y:1});
  assert.ok(Math.abs(Math.hypot(r.player.x-x,r.player.y-y)-r.player.speed*0.1)<0.01);
  r.start(); assert.equal(r.elapsed,0); assert.equal(r.level,1); assert.equal(r.enemies.length,0);
});
test('pause freezes time and player movement', () => {
  const r = new Run(); r.start(); r.pause(); r.update(1,{x:1,y:0});
  assert.equal(r.elapsed,0); assert.equal(r.player.x,0); r.resume(); r.update(.1,{x:0,y:0}); assert.ok(r.elapsed>0);
});
test('automatic bolts damage enemies without attack input', () => {
  const r = new Run(() => .5); r.start(); r.spawn('slime',70,0);
  for(let i=0;i<120;i++) r.update(1/60,{x:0,y:0});
  assert.ok(r.kills>=1); assert.ok(r.gems.length>0 || r.xp>0);
});
test('level-up offers three distinct upgrades and freezes combat until choice', () => {
  const r = new Run(); r.start(); r.addXp(10);
  assert.equal(r.status,'upgrade'); assert.equal(new Set(r.choices.map(c=>c.id)).size,3);
  r.update(1,{x:1,y:0}); assert.equal(r.elapsed,0);
  assert.throws(()=>r.chooseUpgrade('invalid')); assert.equal(r.status,'upgrade');
  r.chooseUpgrade(r.choices[0].id); assert.equal(r.status,'playing'); assert.equal(r.level,2);
});
test('large experience awards retain subsequent level-ups', () => {
  const r=new Run(); r.start(); r.addXp(100); let count=0;
  while(r.status==='upgrade' && count<20){r.chooseUpgrade(r.choices[0].id);count++;}
  assert.ok(count>1); assert.equal(r.status,'playing');
});
test('boss appears once and victory requires defeating it and reaching five minutes', () => {
  const r=new Run(); r.start(); r.elapsed=254.99; r.update(.02,{x:0,y:0});
  assert.equal(r.enemies.filter(e=>e.kind==='boss').length,1);
  r.elapsed=300; r.update(.01,{x:0,y:0}); assert.equal(r.status,'playing');
  r.bossDefeated=true; r.update(.01,{x:0,y:0}); assert.equal(r.status,'won');
});
test('death takes precedence over victory and restart restores all stats', () => {
  const r=new Run(); r.start(); r.elapsed=301; r.bossDefeated=true; r.player.hp=0;
  r.update(.01,{x:0,y:0}); assert.equal(r.status,'dead');
  r.start(); assert.equal(r.status,'playing'); assert.equal(r.player.hp,100); assert.equal(r.bossDefeated,false);
});
test('running away does not despawn the mandatory boss',()=>{
  const r=new Run(); r.start();r.bossSpawned=true;r.spawn('boss',1000,0);
  r.update(.01,{x:0,y:0});assert.ok(r.boss);
});
test('corner spawns retain a safe distance instead of overlapping the player',()=>{
  const r=new Run(()=>.125);r.start();r.player.x=1100;r.player.y=1100;
  const e=r.spawn('brute');assert.ok(Math.hypot(e.x-r.player.x,e.y-r.player.y)>=300);
  assert.ok(Math.abs(e.x)<=r.bounds&&Math.abs(e.y)<=r.bounds);
});
