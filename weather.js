/**
 * Portfolio atmospheric scroll layer, adapted from InferencePort-Web.
 * Soft multi-depth clouds, water, light rain and low-intensity electric glow.
 * One composited 2D canvas, not a second WebGL renderer, no remote textures.
 * Full-viewport painting plus a smooth center falloff avoids clipped cloud art.
 * Scroll moves every layer continuously; the nearest product adjusts intensity.
 */
(() => {
  "use strict";
  const host=document.getElementById("portfolio-weather");
  if (!host) return;
  const desktop=window.matchMedia("(min-width: 1024px)");
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData=Boolean(navigator.connection && navigator.connection.saveData);
  const sections=["projects","experience","honors","skills"];
  const CANVAS_LIMIT=1.5, FPS=30;
  let canvas=null,ctx=null,raf=0,active=false,visible=true,themeDark=false;
  let width=0,height=0,scale=1,last=0,clock=0,scroll=0,targetScroll=0;
  let clouds=[], sectionY={};
  const frac=x=>x-Math.floor(x);
  const mix=(a,b,t)=>a+(b-a)*t;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const rand=x=>frac(Math.sin(x*127.1+87.13)*43758.5453);

  function createCloud(seed,near) {
    // Render a diffuse volume once, then composite it with 2.5D parallax.
    const sprite=document.createElement("canvas");
    sprite.width=560;sprite.height=310;
    const g=sprite.getContext("2d");
    if (!g) return sprite;
    const rgb=themeDark?"153,168,184":"108,133,160";
    const lobes=near?11:9;
    for(let i=0;i<lobes;i++){
      const x=80+rand(seed+i*.53)*400;
      const y=86+rand(seed+i*.91+8)*123;
      const rx=90+rand(seed+i*.23+6)*100;
      const ry=49+rand(seed+i*.29+2)*53;
      const grad=g.createRadialGradient(0,0,0,0,0,1);
      const strength=(near?.55:.38)*(0.65+rand(seed+i*3.3)*.35);
      grad.addColorStop(0,"rgba("+rgb+","+strength.toFixed(3)+")");
      grad.addColorStop(.44,"rgba("+rgb+","+(strength*.58).toFixed(3)+")");
      grad.addColorStop(1,"rgba("+rgb+",0)");
      g.save();g.translate(x,y);g.scale(rx,ry);
      g.fillStyle=grad;g.beginPath();g.arc(0,0,1,0,Math.PI*2);g.fill();g.restore();
    }
    return sprite;
  }

  function prepare() {
    clouds=Array.from({length:16},(_,i)=>{
      const near=i%3!==0;
      return {
        side:i%2===0?-1:1,
        depth:near?.13:.05,
        x:rand(13+i*7.83),y:rand(i*9.1+4),
        sway:rand(i*1.7+11),
        size:(near?390:285)+rand(i*8.7)*165,
        sprite:createCloud(i*3.77+1,near)
      };
    });
  }

  function measure() {
    if (!canvas||!ctx) return;
    width=window.innerWidth;
    height=window.innerHeight;
    scale=Math.min(window.devicePixelRatio||1,CANVAS_LIMIT);
    canvas.width=Math.round(width*scale);
    canvas.height=Math.round(height*scale);
    canvas.style.width=width+"px";
    canvas.style.height=height+"px";
    ctx.setTransform(scale,0,0,scale,0,0);
    sectionY={};
    for(const id of sections){
      const el=document.getElementById(id);
      if(el) sectionY[id]=window.scrollY+el.getBoundingClientRect().top+el.offsetHeight*.42;
    }
    targetScroll=window.scrollY;
  }

  function influence(name,range=1250) {
    if (!(name in sectionY)) return 0;
    const distance=Math.abs((scroll+height*.58)-sectionY[name]);
    return Math.pow(clamp(1-distance/range),1.6);
  }

  function cloudPass() {
    for(const cloud of clouds){
      const size=cloud.size;
      const w=size, h=size*.55;
      // Screen-wrap *after* adding the scroll-linked displacement. The
      // clouds never end at a page section or a sharp gutter mask.
      const span=height+h*2;
      const shift=scroll*cloud.depth+clock*(cloud.depth*.0065+.002);
      const y=((cloud.y*span+shift)%span+span)%span-h;
      const flank=cloud.side===-1 ? width*.075 : width*.925;
      const x=flank+(cloud.x-.48)*width*.22+
        Math.sin(clock*.000085+cloud.sway*6)*18;
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate((cloud.side*.025)+Math.sin(clock*.00005+cloud.sway)*.022);
      ctx.globalAlpha=(themeDark?.9:.9)*(cloud.depth>.1?.98:.80);
      ctx.drawImage(cloud.sprite,-w/2,-h/2,w,h);
      ctx.restore();
    }
  }

  function rainPass(weight) {
    if(weight<.012)return;
    const color=themeDark?"155,194,217":"73,131,176";
    ctx.save();
    ctx.lineWidth=1.45;
    ctx.strokeStyle="rgba("+color+","+(weight*(themeDark?.5:.45)).toFixed(3)+")";
    ctx.beginPath();
    for(let i=0;i<110;i++){
      const side=i%2===0?-1:1;
      const x=(side<0?width*.04:width*.96)+(rand(i*7.2+2)-.5)*width*.27;
      const y=(rand(i*12.34+4)*height+scroll*.51+clock*.09*(.45+rand(i)) )%(height+90)-45;
      const length=13+rand(i*8.33+6)*35;
      ctx.moveTo(x,y);ctx.lineTo(x-3-length*.16,y+length);
    }
    ctx.stroke();ctx.restore();
  }

  function waterPass(weight) {
    if(weight<.015)return;
    ctx.save();
    ctx.strokeStyle=themeDark?"rgba(96,167,204,.26)":"rgba(83,153,191,.20)";
    ctx.lineWidth=1.22;
    ctx.globalAlpha=clamp(weight);
    const y0=height*.73+Math.sin(clock*.00016)*12;
    for(let j=0;j<5;j++){
      const y=y0+j*17;
      for(const side of [-1,1]){
        const x=side===-1 ? -70 : width-320;
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.bezierCurveTo(x+80,y+Math.sin(clock*.0005+j)*14,x+152,y-13,x+235,y+2);
        ctx.bezierCurveTo(x+265,y+6,x+290,y-6,x+355,y+3);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function electricPass(weight) {
    if(weight<.02)return;
    // No strobing / random flashes: a slowly breathing conductor glow.
    const breath=.72+.28*Math.sin(clock*.00075);
    const power=clamp(weight*breath);
    ctx.save();
    for(const side of [-1,1]){
      const x=side<0?width*.13:width*.87;
      const y=height*.20+Math.sin(clock*.0002+side)*42;
      ctx.translate(x,y);
      ctx.scale(side,1);
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(14,43);ctx.lineTo(-5,73);ctx.lineTo(10,110);
      ctx.lineTo(-24,166);ctx.lineTo(2,136);ctx.lineTo(-3,100);
      ctx.lineTo(26,57);
      ctx.strokeStyle=themeDark?"rgba(255,221,132,.82)":"rgba(188,139,45,.72)";
      ctx.globalAlpha=power*.8;
      ctx.shadowBlur=25;ctx.shadowColor="#f6d58e";
      ctx.lineWidth=1.7;ctx.stroke();
      ctx.shadowBlur=0;
      ctx.setTransform(scale,0,0,scale,0,0);
    }
    ctx.restore();
  }

  function softenCenter() {
    // Preserve natural transparent clouds, with a long gradient toward the
    // center instead of cutting the scene into narrow cropped side stickers.
    const contentLeft=Math.max(24,(width-Math.min(1060,width-48))/2);
    const inner=clamp((contentLeft+145)/width,.19,.42);
    const right=1-inner;
    const g=ctx.createLinearGradient(0,0,width,0);
    g.addColorStop(0,"rgba(0,0,0,1)");
    g.addColorStop(clamp(inner*.52,.02,.22),"rgba(0,0,0,.86)");
    g.addColorStop(inner,"rgba(0,0,0,.18)");
    g.addColorStop(.5,"rgba(0,0,0,0)");
    g.addColorStop(right,"rgba(0,0,0,.18)");
    g.addColorStop(1-clamp(inner*.52,.02,.22),"rgba(0,0,0,.86)");
    g.addColorStop(1,"rgba(0,0,0,1)");
    ctx.globalCompositeOperation="destination-in";
    ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
    ctx.globalCompositeOperation="source-over";
  }

  function render() {
    if (!ctx||!width||!height)return;
    ctx.clearRect(0,0,width,height);
    const projects=influence("projects",1500);
    const experience=influence("experience",1500);
    const honors=influence("honors",1550);
    const skills=influence("skills",1500);
    cloudPass();
    rainPass(Math.max(projects*.9,experience*.55,skills*.4,.30));
    waterPass(Math.max(projects*.7,skills*.5,.15));
    electricPass(Math.max(experience*.55,honors*.95,.28));
    softenCenter();
    // Choose the closest active product, not whichever section appears first.
    const nearest=[["rain",projects],["charged",experience],
      ["electric",honors],["mist",skills]]
      .reduce((best,entry)=>entry[1]>best[1]?entry:best,["cloud",.32]);
    host.dataset.phase=nearest[0];
    host.dataset.weatherScroll=Math.round(scroll);
  }

  function frame(now){
    raf=0;
    if(!active || !visible)return;
    raf=window.requestAnimationFrame(frame);
    if(now-last<1000/FPS)return;
    const delta=last?Math.min(now-last,80):33;
    last=now;clock+=delta;
    scroll=mix(scroll,targetScroll,1-Math.exp(-delta/165));
    render();
  }

  function onScroll(){targetScroll=window.scrollY;}
  function onResize(){measure();render();}
  function onTheme(){
    const dark=document.documentElement.getAttribute("data-theme")==="dark";
    if(dark===themeDark)return;
    themeDark=dark;prepare();render();
  }
  function activate(){
    if(active||!desktop.matches||reduced.matches||saveData)return;
    canvas=document.createElement("canvas");
    canvas.className="portfolio-weather-canvas";
    canvas.setAttribute("aria-hidden","true");
    ctx=canvas.getContext("2d",{alpha:true});
    if(!ctx){canvas=null;return;}
    host.replaceChildren(canvas);
    themeDark=document.documentElement.getAttribute("data-theme")==="dark";
    prepare();measure();
    scroll=targetScroll=window.scrollY;
    active=true;
    host.classList.add("is-active");
    visible=!document.hidden;
    if(visible)raf=window.requestAnimationFrame(frame);
  }
  function deactivate(){
    active=false;
    if(raf)window.cancelAnimationFrame(raf);
    raf=0;last=0;
    host.classList.remove("is-active");
    host.replaceChildren();
    canvas=null;ctx=null;clouds=[];
    host.dataset.phase="cloud";
  }
  function reconcile(){
    if(desktop.matches&&!reduced.matches&&!saveData)activate();
    else deactivate();
  }
  function visibility(){
    visible=!document.hidden;
    if(!active)return;
    if(!visible && raf){window.cancelAnimationFrame(raf);raf=0;}
    if(visible&&!raf){last=0;raf=window.requestAnimationFrame(frame);}
  }
  const observer=new MutationObserver(onTheme);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
  window.addEventListener("scroll",onScroll,{passive:true});
  window.addEventListener("resize",onResize,{passive:true});
  document.addEventListener("visibilitychange",visibility);
  desktop.addEventListener?.("change",reconcile);
  reduced.addEventListener?.("change",reconcile);
  window.addEventListener("pagehide",()=>{deactivate();observer.disconnect();},{once:true});
  reconcile();
})();