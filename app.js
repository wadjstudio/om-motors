import * as T from './assets/three.module.js';
import { loadGeneratedVehicle } from './model-loader.js';

const host = document.querySelector('#viewer');
let renderer;
try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); }
catch { document.querySelector('#fallback').hidden = false; document.querySelectorAll('.view-tools button,.swatch').forEach(b => b.disabled = true); }
if (renderer) {
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
host.appendChild(renderer.domElement);
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(33, 1, .1, 100);
const car = new T.Group(); scene.add(car);
const paint = new T.MeshPhysicalMaterial({color: '#45494a', metalness: .7, roughness: .28, clearcoat: 1, clearcoatRoughness: .2});
const black = new T.MeshStandardMaterial({color: '#0e1211', metalness: .2, roughness: .45});
const glass = new T.MeshPhysicalMaterial({color: '#152324',metalness: .5,roughness: .13,clearcoat: 1});
const bronze = new T.MeshStandardMaterial({color: '#c4a477',metalness: .85,roughness: .26});
const rubber = new T.MeshStandardMaterial({color: '#111211',roughness: .94});
const white = new T.MeshStandardMaterial({color:'#e7f5ff',emissive:'#c9eaff',emissiveIntensity: 2});
const red = new T.MeshStandardMaterial({color:'#a52820',emissive:'#ec3527',emissiveIntensity: 1.1});

// A self-contained concept mesh inspired by the supplied references.
function mesh(geometry, material, position = [0,0,0], parent=car) {
 const m = new T.Mesh(geometry, material); m.position.set(...position); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function box(size, pos, mat, parent=car) {return mesh(new T.BoxGeometry(...size),mat,pos,parent);}
function line(points, mat, radius=.012, parent=car) {
 const curve = new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
 return mesh(new T.TubeGeometry(curve,32,radius,6,false),mat,[0,0,0],parent);
}
function panel(points, depth, mat, z=0, bevel=.035) {
 const shape=new T.Shape(); points.forEach((p,i)=>i?shape.lineTo(...p):shape.moveTo(...p)); shape.closePath();
 const geometry=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,steps:1});
 return mesh(geometry,mat,[0,0,z]);
}
// Body side profile with real wheel openings, mirrored across the width.
const body = new T.Shape();
body.moveTo(-2.36,.55); body.lineTo(-2.44,1.06); body.quadraticCurveTo(-2.4,1.35,-2.08,1.46);
body.lineTo(-.96,1.56);body.lineTo(.6,1.59);body.lineTo(1.94,1.55);body.quadraticCurveTo(2.3,1.45,2.34,1.08);
body.lineTo(2.31,.58);body.lineTo(2.05,.52);body.lineTo(2.02,.69);
body.absarc(1.46,.68,.57,0,Math.PI,false);body.lineTo(.89,.49);body.lineTo(-.89,.49);body.lineTo(-.89,.68);
body.absarc(-1.46,.68,.57,0,Math.PI,false);body.lineTo(-2.04,.53);body.lineTo(-2.36,.55);
mesh(new T.ExtrudeGeometry(body,{depth:1.73,bevelEnabled:true,bevelSize:.065,bevelThickness:.065,bevelSegments:4,curveSegments:30}),paint,[0,0,-.865]);
// Cabin: tapered roof, sloped windshield and rear glass.
function loft(sections, mat) {
 const v=[], idx=[];
 sections.forEach(([x,y,width,base])=>v.push(x,base,-width,x,y,-width*.82,x,y,width*.82,x,base,width));
 for(let i=0;i<sections.length-1;i++) for(let j=0;j<4;j++) {const a=i*4+j,b=i*4+(j+1)%4,c=(i+1)*4+j,d=(i+1)*4+(j+1)%4;idx.push(a,c,b,b,c,d);}
 idx.push(0,1,2,0,2,3);let e=(sections.length-1)*4;idx.push(e,e+2,e+1,e,e+3,e+2);
 for(let i=0;i<idx.length;i+=3) [idx[i+1],idx[i+2]]=[idx[i+2],idx[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return mesh(g,mat);
}
loft([[-1.1,1.54,.81,1.46],[-.45,2.22,.76,1.5],[.86,2.24,.76,1.52],[1.67,1.6,.8,1.5]],glass);
loft([[-.45,2.25,.77,2.21],[.85,2.27,.77,2.23],[1.13,2.18,.76,2.14]],paint);
// Structural pillars and window edges.
for(const side of [-1,1]) {
 const z=side*.805;
 line([[-1.09,1.54,z],[-.46,2.23,side*.63],[.87,2.25,side*.63],[1.68,1.58,z]],paint,.054);
 line([[-1.09,1.54,z],[.5,1.56,z],[1.67,1.58,z]],bronze,.012);
 line([[.27,1.56,z],[.23,2.24,side*.63]],black,.045);
 line([[1.04,1.57,z],[.86,2.24,side*.63]],paint,.035);
 // Door seams, rocker trim, handles and folding mirrors.
 for(const x of [-.12,1.03]) line([[x,1.5,side*.937],[x+.02,.97,side*.941],[x-.03,.62,side*.927]],black,.006);
 line([[-.89,.51,side*.95],[.1,.51,side*.95],[.88,.51,side*.95]],black,.045);
 for(const x of [-.32,.92]) {box([.2,.037,.027],[x,1.39,side*.945],bronze);}
 const mirror=mesh(new T.SphereGeometry(1,24,12),paint,[-.92,1.65,side*1.02]);mirror.scale.set(.18,.09,.14);
 box([.1,.04,.15],[-.85,1.59,side*.91],black);
 line([[-2.02,1.34,side*.62],[-1.65,1.44,side*.63],[-1.15,1.49,side*.57]],paint,.012);
 // Arches accent the wheel silhouettes.
 for(const x of [-1.46,1.46]) {const pts=[];for(let i=0;i<=30;i++){let a=i/30*Math.PI;pts.push([x+.59*Math.cos(a),.68+.59*Math.sin(a),side*.94]);}line(pts,black,.031);}
}
// Four detailed alloy wheels.
for(const x of [-1.46,1.46]) for(const side of [-1,1]) {
 const wheel=new T.Group();wheel.position.set(x,.66,side*.91);car.add(wheel);
 mesh(new T.TorusGeometry(.405,.135,18,64),rubber,[0,0,0],wheel);
 mesh(new T.CylinderGeometry(.368,.368,.22,48),black,[0,0,0],wheel).rotation.x=Math.PI/2;
 mesh(new T.TorusGeometry(.346,.015,10,64),bronze,[0,0,side*.14],wheel);
 mesh(new T.CylinderGeometry(.073,.073,.035,24),bronze,[0,0,side*.155],wheel).rotation.x=Math.PI/2;
 for(let i=0;i<10;i++) {const a=i*Math.PI/5;const spoke=box([.055,.28,.028],[Math.sin(a)*.205,Math.cos(a)*.205,side*.145],bronze,wheel);spoke.rotation.z=-a+.15;}
 for(let i=0;i<40;i++) {const a=i*Math.PI/20;const tread=box([.013,.035,.17],[Math.sin(a)*.536,Math.cos(a)*.536,0],black,wheel);tread.rotation.z=-a;}
}
// Front fascia, grille diamonds, LED signatures and OM emblem.
box([.1,.43,1.24],[-2.44,1.04,0],black);
for(let i=-5;i<=5;i++) for(let j=0;j<3;j++) {
 const y=.88+j*.11,z=i*.105;
 const bar=box([.025,.13,.013],[-2.501,y,z],bronze);bar.rotation.x=.65;
 const bar2=box([.026,.13,.013],[-2.503,y,z+.063],black);bar2.rotation.x=-.65;
}
const emblem=mesh(new T.TorusGeometry(.093,.014,12,40),bronze,[-2.53,1.06,0]);emblem.rotation.y=Math.PI/2;
for(const s of [-1,1]) {
 line([[-2.41,1.31,s*.87],[-2.48,1.29,s*.72],[-2.49,1.27,s*.51]],white,.022);
 line([[-2.46,1.24,s*.81],[-2.5,1.22,s*.71],[-2.49,1.23,s*.5]],white,.009);
 box([.055,.26,.15],[-2.45,.73,s*.77],black);
 line([[2.33,1.4,s*.8],[2.4,1.36,s*.61],[2.41,1.36,0]],red,.024);
 box([.06,.09,.25],[2.38,.62,s*.6],bronze);
 box([.07,.055,.2],[2.42,.62,s*.6],black);
}
box([.11,.09,1.75],[-2.34,.5,0],black);
box([.03,.11,.35],[-2.514,.78,0],black);
line([[2.38,1.06,-.42],[2.41,1.04,0],[2.38,1.06,.42]],black,.008);
const rearBadge=mesh(new T.TorusGeometry(.07,.012,12,30),bronze,[2.412,1.2,0]);rearBadge.rotation.y=Math.PI/2;
box([.4,.035,1.37],[1.19,2.18,0],black);
box([1.02,.01,1.02],[.1,2.265,0],glass);

// Studio lighting and an environment made locally, with no external HDR requests.
scene.add(new T.HemisphereLight('#e7f0df','#484b3c',2.2));
const key=new T.DirectionalLight('#fff0dc',4);key.position.set(-4,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.normalBias=.035;key.shadow.radius=3;scene.add(key);
const rim=new T.DirectionalLight('#d7e8ef',3);rim.position.set(3,4,-5);scene.add(rim);
const envScene=new T.Scene();envScene.background=new T.Color('#677162');
for(const [position,scale] of [[[0,7,0],[12,.1,6]],[[-5,3,3],[.1,4,8]],[[5,3,-4],[.1,3,8]]]) {const m=new T.Mesh(new T.BoxGeometry(...scale),new T.MeshBasicMaterial({color:'#fcf5e5'}));m.position.set(...position);envScene.add(m);}
const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(envScene,.04).texture;pmrem.dispose();
const floor=mesh(new T.CircleGeometry(7,96),new T.ShadowMaterial({opacity:.32}),[0,.09,0],scene);floor.rotation.x=-Math.PI/2;
const ring=mesh(new T.RingGeometry(3.09,3.105,120),new T.MeshBasicMaterial({color:'#c4a477',transparent:true,opacity:.14,side:T.DoubleSide}),[0,.085,0],scene);ring.rotation.x=-Math.PI/2;

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let auto = !reduced.matches, angle = -.75, elevation = .3, distance = 9.2, dragging = false, px=0, py=0, last=0, dirty=true, lastFrame=0, previousCamera='', frames=0, generatedVehicle=null, modelStatus='loading';
const rotationButton=document.querySelector('#rotate');
function updateRotation(){rotationButton.textContent=auto?'Ⅱ':'▷';rotationButton.setAttribute('aria-pressed',String(auto));rotationButton.setAttribute('aria-label',auto?'Pause automatic rotation':'Start automatic rotation');}
updateRotation();
rotationButton.onclick=()=>{auto=!auto;updateRotation();};
document.querySelector('#reset').onclick=()=>{angle=-.75;elevation=.3;distance=9.2;auto=!reduced.matches;updateRotation();};
document.querySelector('#expand').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.viewer-wrap').requestFullscreen();}catch{document.querySelector('#expand').title='Fullscreen is unavailable in this browser';}};
host.addEventListener('pointerdown',e=>{dragging=true;px=e.clientX;py=e.clientY;auto=false;updateRotation();host.setPointerCapture(e.pointerId);});
host.addEventListener('pointermove',e=>{if(!dragging)return;angle-=(e.clientX-px)*.008;elevation=T.MathUtils.clamp(elevation+(e.clientY-py)*.003,.12,.85);px=e.clientX;py=e.clientY;});
host.addEventListener('pointerup',()=>dragging=false);host.addEventListener('pointercancel',()=>dragging=false);
host.addEventListener('wheel',e=>{if(!host.matches(':focus')&&!dragging)return;e.preventDefault();distance=T.MathUtils.clamp(distance+e.deltaY*.008,6.3,12);},{passive:false});
host.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();auto=false;updateRotation();if(e.key==='ArrowLeft')angle-=.15;if(e.key==='ArrowRight')angle+=.15;if(e.key==='ArrowUp')elevation=Math.min(.85,elevation+.08);if(e.key==='ArrowDown')elevation=Math.max(.12,elevation-.08);if(e.key==='+')distance=Math.max(6.3,distance-.5);if(e.key==='-')distance=Math.min(12,distance+.5);}});
document.querySelectorAll('.swatch').forEach((b,i)=>b.onclick=()=>{paint.color.set(b.dataset.color);generatedVehicle?.setPaint(b.dataset.color);dirty=true;document.querySelector('#paint-name').innerHTML=`${b.dataset.name} <small>0${i+1} / 05</small>`;document.querySelectorAll('.swatch').forEach(s=>{s.classList.toggle('active',s===b);s.setAttribute('aria-pressed',String(s===b));});});

const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true;};new ResizeObserver(resize).observe(host);resize();
let visible=true;new IntersectionObserver(([entry])=>visible=entry.isIntersecting).observe(host);
renderer.setAnimationLoop(time=>{const delta=Math.min((time-last)/1000,.05);last=time;if((!visible&&!dirty)||document.hidden)return;if(auto&&!dragging&&visible)angle+=delta*.11;const currentCamera=`${angle},${elevation},${distance}`;if(!dirty&&currentCamera===previousCamera)return;if(time-lastFrame<33)return;lastFrame=time;previousCamera=currentCamera;const d=distance*(camera.aspect<1.3?1.3:1);camera.position.set(-Math.cos(angle)*d,1.1+Math.sin(elevation)*d,Math.sin(angle)*d);camera.lookAt(0,1.08,0);renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;dirty=false;frames++;});
reduced.addEventListener('change',()=>{if(reduced.matches){auto=false;updateRotation();}});
window.omShowcase={getState:()=>({color:paint.color.getHexString(),angle,auto,meshes:car.children.length,frames,modelStatus,generatedModel:generatedVehicle?.getState()})};
loadGeneratedVehicle(scene,car,renderer,()=>dirty=true).then(vehicle=>{
 generatedVehicle=vehicle;modelStatus='ready';vehicle.setPaint(document.querySelector('.swatch.active').dataset.color);
 document.querySelector('.viewer-label small').textContent='EXTERIOR / IMAGE-GENERATED 3D MODEL';
}).catch(error=>{modelStatus='fallback';console.warn('Generated vehicle could not load; showing concept.',error.message);});
}
document.querySelector('#year').textContent=new Date().getFullYear();

// Dual Model Switcher (OM1 SUV & OM2 Sedan)
function setActiveModel(modelId) {
  document.querySelectorAll('.model-tab-btn, .editions-model-btn').forEach(btn => {
    const isActive = btn.dataset.model === modelId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  const panelOm1 = document.querySelector('#panel-om1');
  const panelOm2 = document.querySelector('#panel-om2');
  if (panelOm1 && panelOm2) {
    panelOm1.classList.toggle('active', modelId === 'om1');
    panelOm2.classList.toggle('active', modelId === 'om2');
  }

  const editionsOm1 = document.querySelector('#editions-panel-om1');
  const editionsOm2 = document.querySelector('#editions-panel-om2');
  if (editionsOm1 && editionsOm2) {
    editionsOm1.classList.toggle('active', modelId === 'om1');
    editionsOm2.classList.toggle('active', modelId === 'om2');
  }

  const interiorOm1 = document.querySelector('#interior-block-om1');
  const interiorOm2 = document.querySelector('#interior-block-om2');
  if (interiorOm1 && interiorOm2) {
    interiorOm1.classList.toggle('active', modelId === 'om1');
    interiorOm2.classList.toggle('active', modelId === 'om2');
  }

  if (modelId === 'om1' && typeof resize === 'function') {
    requestAnimationFrame(() => resize());
  }
}

document.querySelectorAll('.model-tab-btn, .editions-model-btn').forEach(btn => {
  btn.onclick = () => {
    const model = btn.dataset.model;
    if (model) setActiveModel(model);
  };
});

// OM1 Bespoke Interior Leather Configurator
const interiorImgOm1 = document.querySelector('#interior-image-om1') || document.querySelector('#interior-image');
const leatherNameOm1 = document.querySelector('#leather-name-om1') || document.querySelector('#leather-name');
const leatherSwatchesOm1 = document.querySelectorAll('#interior-block-om1 .leather-swatch, .leather-swatch');
const experienceSec = document.querySelector('#experience');

if (interiorImgOm1 && leatherSwatchesOm1.length) {
  leatherSwatchesOm1.forEach(b => {
    if (b.dataset.img) {
      const pre = new Image();
      pre.src = b.dataset.img;
    }
  });

  leatherSwatchesOm1.forEach((btn, i) => {
    btn.onclick = () => {
      if (btn.classList.contains('active') && interiorImgOm1.src.includes(btn.dataset.img)) return;
      interiorImgOm1.style.opacity = '0.35';
      const tempImg = new Image();
      tempImg.src = btn.dataset.img;
      tempImg.onload = () => {
        interiorImgOm1.src = btn.dataset.img;
        interiorImgOm1.style.opacity = '1';
      };
      if (tempImg.complete) {
        interiorImgOm1.src = btn.dataset.img;
        interiorImgOm1.style.opacity = '1';
      }
      if (leatherNameOm1) {
        leatherNameOm1.innerHTML = `${btn.dataset.name} <small>0${i + 1} / 0${leatherSwatchesOm1.length}</small>`;
      }
      leatherSwatchesOm1.forEach(s => {
        const active = s === btn;
        s.classList.toggle('active', active);
        s.setAttribute('aria-pressed', String(active));
      });
    };
  });
}

// OM2 Sedan Exterior Paint & Angle Configurator
const sedanImg = document.querySelector('#sedan-paint-img');
const sedanPaintName = document.querySelector('#sedan-paint-name');
const sedanSwatches = document.querySelectorAll('.sedan-swatch');
const sedanAngleBtns = document.querySelectorAll('.sedan-angle-btn');
let currentSedanPaint = 'assets/sedan-paint-grey.jpg';

if (sedanSwatches.length && sedanImg) {
  sedanSwatches.forEach(b => {
    if (b.dataset.img) {
      const pre = new Image();
      pre.src = b.dataset.img;
    }
  });

  sedanSwatches.forEach((btn, i) => {
    btn.onclick = () => {
      currentSedanPaint = btn.dataset.img;
      sedanImg.style.opacity = '0.35';
      const tempImg = new Image();
      tempImg.src = btn.dataset.img;
      tempImg.onload = () => {
        sedanImg.src = btn.dataset.img;
        sedanImg.style.opacity = '1';
      };
      if (tempImg.complete) {
        sedanImg.src = btn.dataset.img;
        sedanImg.style.opacity = '1';
      }
      if (sedanPaintName) {
        sedanPaintName.innerHTML = `${btn.dataset.name} <small>0${i + 1} / 0${sedanSwatches.length}</small>`;
      }
      sedanSwatches.forEach(s => {
        const active = s === btn;
        s.classList.toggle('active', active);
        s.setAttribute('aria-pressed', String(active));
      });
      sedanAngleBtns.forEach(ab => {
        ab.classList.toggle('active', ab.dataset.isPaint === 'true');
      });
    };
  });
}

// OM2 Sedan Camera Angles
if (sedanAngleBtns.length && sedanImg) {
  sedanAngleBtns.forEach(btn => {
    if (btn.dataset.img && btn.dataset.isPaint !== 'true') {
      const pre = new Image();
      pre.src = btn.dataset.img;
    }
    btn.onclick = () => {
      const targetSrc = btn.dataset.isPaint === 'true' ? currentSedanPaint : btn.dataset.img;
      sedanImg.style.opacity = '0.35';
      const tempImg = new Image();
      tempImg.src = targetSrc;
      tempImg.onload = () => {
        sedanImg.src = targetSrc;
        sedanImg.style.opacity = '1';
      };
      if (tempImg.complete) {
        sedanImg.src = targetSrc;
        sedanImg.style.opacity = '1';
      }
      sedanAngleBtns.forEach(ab => ab.classList.toggle('active', ab === btn));
    };
  });
}

// OM2 Sedan Bespoke Interior Leather Configurator
const interiorImgOm2 = document.querySelector('#interior-image-om2');
const leatherNameOm2 = document.querySelector('#leather-name-om2');
const sedanLeatherSwatches = document.querySelectorAll('.sedan-leather-swatch');

if (interiorImgOm2 && sedanLeatherSwatches.length) {
  sedanLeatherSwatches.forEach(b => {
    if (b.dataset.img) {
      const pre = new Image();
      pre.src = b.dataset.img;
    }
  });

  sedanLeatherSwatches.forEach((btn, i) => {
    btn.onclick = () => {
      if (btn.classList.contains('active') && interiorImgOm2.src.includes(btn.dataset.img)) return;
      interiorImgOm2.style.opacity = '0.35';
      const tempImg = new Image();
      tempImg.src = btn.dataset.img;
      tempImg.onload = () => {
        interiorImgOm2.src = btn.dataset.img;
        interiorImgOm2.style.opacity = '1';
      };
      if (tempImg.complete) {
        interiorImgOm2.src = btn.dataset.img;
        interiorImgOm2.style.opacity = '1';
      }
      if (leatherNameOm2) {
        leatherNameOm2.innerHTML = `${btn.dataset.name} <small>0${i + 1} / 0${sedanLeatherSwatches.length}</small>`;
      }
      sedanLeatherSwatches.forEach(s => {
        const active = s === btn;
        s.classList.toggle('active', active);
        s.setAttribute('aria-pressed', String(active));
      });
    };
  });
}

// Cabin View Toggle (Clear View / Details View)
document.querySelectorAll('.cabin-view-btn').forEach(btn => {
  btn.onclick = () => {
    if (experienceSec) {
      const isClear = experienceSec.classList.toggle('clear-view');
      document.querySelectorAll('.cabin-view-btn').forEach(b => {
        b.innerHTML = isClear ? 'Show details <span>✕</span>' : 'Clear cabin view <span>👁</span>';
      });
    }
  };
});

// Trims Configuration Interaction (OM1 & OM2)
document.querySelectorAll('.edition-card').forEach(card => {
  const code = card.querySelector('.edition-code')?.textContent || 'GT';
  const isOm2 = card.dataset.trim?.startsWith('om2');
  const btn = card.querySelector('.edition-btn');
  if (btn) {
    btn.onclick = () => {
      if (isOm2) {
        setActiveModel('om2');
        const sedanViewerLabel = document.querySelector('#panel-om2 .viewer-label span');
        if (sedanViewerLabel) sedanViewerLabel.textContent = `ANTIGRAVITY OM2 · ${code}`;
      } else {
        setActiveModel('om1');
        const om1ViewerLabel = document.querySelector('#panel-om1 .viewer-label span');
        if (om1ViewerLabel) om1ViewerLabel.textContent = `ANTIGRAVITY OM1 · ${code}`;
      }
      document.querySelectorAll('.edition-card').forEach(c => c.classList.toggle('active-selected', c === card));
      cartState.model = isOm2 ? 'om2' : 'om1';
      cartState.trim = code;
      updateDrawerUI();
    };
  }
});

// ========================================================
// PURCHASE LIST / CART & RESERVATION SYSTEM
// ========================================================
const cartState = {
  model: 'om1', // 'om1' | 'om2'
  trim: 'GT',   // 'GT' | 'GTX' | 'GTX+'
  paintName: 'Graphite Grey',
  paintColor: '#45494a',
  paintImg: 'assets/hero.jpeg',
  leatherName: 'Desert Camel',
  leatherColor: '#b87b4f',
  addons: new Set(),
  prices: {
    om1: { 'GT': 950000, 'GTX': 1480000, 'GTX+': 2000000 },
    om2: { 'GT': 1350000, 'GTX': 1850000, 'GTX+': 2600000 }
  },
  addonPrices: {
    care: 45000,
    wallbox: 35000,
    ppf: 28000,
    starlight: 22000
  },
  addonTitles: {
    care: 'باقة الصيانة الشاملة OM Care+ (5 سنوات)',
    wallbox: 'شاحن منزلي فائق السرعة Wallbox 22kW',
    ppf: 'حماية نانو سيراميك كاملة Ultra-Shield PPF',
    starlight: 'سقف بانورامي بألياف ضوئية Starlight Roof'
  }
};

const formatEGP = num => Number(num).toLocaleString('en-US');

// DOM Elements
const purchaseDrawer = document.querySelector('#purchase-drawer');
const drawerBackdrop = document.querySelector('#drawer-backdrop');
const openCartBtn = document.querySelector('#open-cart-btn');
const closeDrawerBtn = document.querySelector('#close-drawer-btn');
const floatingCartBtn = document.querySelector('#floating-cart-btn');
const cartBadge = document.querySelector('#cart-badge');
const drawerCarImg = document.querySelector('#drawer-car-img');
const drawerModelPill = document.querySelector('#drawer-model-pill');
const drawerCarTitle = document.querySelector('#drawer-car-title');
const drawerCarTier = document.querySelector('#drawer-car-tier');
const drawerBasePrice = document.querySelector('#drawer-base-price');
const drawerPaintSwatch = document.querySelector('#drawer-paint-swatch');
const drawerPaintName = document.querySelector('#drawer-paint-name');
const drawerLeatherSwatch = document.querySelector('#drawer-leather-swatch');
const drawerLeatherName = document.querySelector('#drawer-leather-name');
const summaryBasePrice = document.querySelector('#summary-base-price');
const summaryAddonsPrice = document.querySelector('#summary-addons-price');
const summaryTotalPrice = document.querySelector('#summary-total-price');
const floatingCartSub = document.querySelector('#floating-cart-sub');
const drawerTrimPills = document.querySelectorAll('.trim-pill');
const addonCheckboxes = document.querySelectorAll('.addon-checkbox');
const reservationForm = document.querySelector('#reservation-form');

// Confirmation Modal Elements
const orderModal = document.querySelector('#order-confirm-modal');
const orderModalBackdrop = document.querySelector('#order-modal-backdrop');
const modalRefCode = document.querySelector('#modal-ref-code');
const modalClientName = document.querySelector('#modal-client-name');
const modalSummaryCar = document.querySelector('#modal-summary-car');
const modalSummaryPaint = document.querySelector('#modal-summary-paint');
const modalSummaryLeather = document.querySelector('#modal-summary-leather');
const modalSummaryAddons = document.querySelector('#modal-summary-addons');
const modalSummaryTotal = document.querySelector('#modal-summary-total');
const modalWhatsappBtn = document.querySelector('#modal-whatsapp-btn');
const modalPrintBtn = document.querySelector('#modal-print-btn');
const modalCloseBtn = document.querySelector('#modal-close-btn');

function updateDrawerUI() {
  const isOm1 = cartState.model === 'om1';
  const modelName = isOm1 ? 'Antigravity OM1' : 'Antigravity OM2';
  const modelType = isOm1 ? 'OM1 SUV' : 'OM2 SEDAN';
  const tierLabels = {
    'GT': isOm1 ? 'SUV Entry · الفئة الأولى' : 'Sedan GT · جراند تورر',
    'GTX': isOm1 ? 'Sport Luxury · الفئة المتوسطة' : 'Performance AWD · أداء كلي متطور',
    'GTX+': isOm1 ? 'Flagship Hybrid · الفئة الأعلى' : 'Apex Hyper · الإصدار الخارق 850 HP'
  };

  if (drawerModelPill) drawerModelPill.textContent = modelType;
  if (drawerCarTitle) drawerCarTitle.innerHTML = `${modelName} <b>${cartState.trim}</b>`;
  if (drawerCarTier) drawerCarTier.textContent = tierLabels[cartState.trim] || '';

  // Thumbnail
  if (drawerCarImg) {
    if (isOm1) {
      drawerCarImg.src = 'assets/hero.jpeg';
    } else {
      drawerCarImg.src = cartState.paintImg || 'assets/sedan-paint-grey.jpg';
    }
  }

  // Paint & Leather
  if (drawerPaintSwatch) drawerPaintSwatch.style.background = cartState.paintColor;
  if (drawerPaintName) drawerPaintName.textContent = cartState.paintName;
  if (drawerLeatherSwatch) drawerLeatherSwatch.style.background = cartState.leatherColor;
  if (drawerLeatherName) drawerLeatherName.textContent = cartState.leatherName;

  // Pricing calculations
  const basePrice = (cartState.prices[cartState.model] && cartState.prices[cartState.model][cartState.trim]) || 950000;
  let addonsTotal = 0;
  cartState.addons.forEach(id => {
    addonsTotal += (cartState.addonPrices[id] || 0);
  });
  const grandTotal = basePrice + addonsTotal;

  if (drawerBasePrice) drawerBasePrice.textContent = formatEGP(basePrice);
  if (summaryBasePrice) summaryBasePrice.textContent = `${formatEGP(basePrice)} EGP`;
  if (summaryAddonsPrice) summaryAddonsPrice.textContent = `${formatEGP(addonsTotal)} EGP`;
  if (summaryTotalPrice) summaryTotalPrice.innerHTML = `${formatEGP(grandTotal)} <small>EGP</small>`;

  // Update floating quick pill
  if (floatingCartSub) {
    const shortCode = `${isOm1 ? 'OM1' : 'OM2'} ${cartState.trim}`;
    floatingCartSub.textContent = `${shortCode} · ${formatEGP(grandTotal)} EGP`;
  }

  // Trim buttons active state
  drawerTrimPills.forEach(pill => {
    pill.classList.toggle('active', pill.dataset.trimCode === cartState.trim);
  });

  // Badge count: 1 car + number of selected addons
  const count = 1 + cartState.addons.size;
  if (cartBadge) cartBadge.textContent = count;
  const floatingBadge = document.querySelector('.floating-cart-badge');
  if (floatingBadge) floatingBadge.textContent = count;
}

function openDrawer() {
  if (purchaseDrawer) purchaseDrawer.classList.add('open');
  if (drawerBackdrop) drawerBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  if (purchaseDrawer) purchaseDrawer.classList.remove('open');
  if (drawerBackdrop) drawerBackdrop.classList.remove('active');
  document.body.style.overflow = '';
}

// Drawer listeners
if (openCartBtn) openCartBtn.onclick = openDrawer;
if (floatingCartBtn) floatingCartBtn.onclick = openDrawer;
if (closeDrawerBtn) closeDrawerBtn.onclick = closeDrawer;
if (drawerBackdrop) drawerBackdrop.onclick = closeDrawer;

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeDrawer();
    closeOrderModal();
  }
});

// Trim selector inside drawer
drawerTrimPills.forEach(pill => {
  pill.onclick = () => {
    cartState.trim = pill.dataset.trimCode;
    updateDrawerUI();
  };
});

// Addons checkboxes
addonCheckboxes.forEach(box => {
  box.onchange = () => {
    const id = box.dataset.addonId;
    if (box.checked) cartState.addons.add(id);
    else cartState.addons.delete(id);
    updateDrawerUI();
  };
});

// Sync paint changes from showroom
document.querySelectorAll('.swatch').forEach(b => {
  b.addEventListener('click', () => {
    cartState.model = 'om1';
    cartState.paintName = b.dataset.name || 'Graphite Grey';
    cartState.paintColor = b.dataset.color || '#45494a';
    updateDrawerUI();
  });
});

document.querySelectorAll('.sedan-swatch').forEach(b => {
  b.addEventListener('click', () => {
    cartState.model = 'om2';
    cartState.paintName = b.dataset.name || 'Matte Grey';
    cartState.paintColor = b.style.getPropertyValue('--swatch') || '#484c4f';
    cartState.paintImg = b.dataset.img || 'assets/sedan-paint-grey.jpg';
    updateDrawerUI();
  });
});

// Sync leather changes from interior
document.querySelectorAll('#interior-block-om1 .leather-swatch, .leather-swatch').forEach(b => {
  b.addEventListener('click', () => {
    cartState.leatherName = b.dataset.name || 'Desert Camel';
    cartState.leatherColor = b.style.getPropertyValue('--swatch') || '#b87b4f';
    updateDrawerUI();
  });
});

document.querySelectorAll('.sedan-leather-swatch').forEach(b => {
  b.addEventListener('click', () => {
    cartState.leatherName = b.dataset.name || 'Saddle Cognac';
    cartState.leatherColor = b.style.getPropertyValue('--swatch') || '#855234';
    updateDrawerUI();
  });
});

// Add to cart buttons in showcase config
document.querySelectorAll('.config-cart-btn').forEach(btn => {
  btn.onclick = () => {
    cartState.model = btn.dataset.model || 'om1';
    setActiveModel(cartState.model);
    updateDrawerUI();
    openDrawer();
  };
});

// Reserve buttons on edition cards
document.querySelectorAll('.edition-reserve-btn').forEach(btn => {
  btn.onclick = () => {
    cartState.model = btn.dataset.model || 'om1';
    cartState.trim = btn.dataset.code || 'GT';
    setActiveModel(cartState.model);
    updateDrawerUI();
    openDrawer();
  };
});

// Confirmation Modal Functions
function openOrderModal(data) {
  if (modalRefCode) modalRefCode.textContent = data.refCode;
  if (modalClientName) modalClientName.textContent = data.name;
  if (modalSummaryCar) modalSummaryCar.textContent = `${data.modelName} ${data.trim}`;
  if (modalSummaryPaint) modalSummaryPaint.textContent = data.paint;
  if (modalSummaryLeather) modalSummaryLeather.textContent = data.leather;
  if (modalSummaryAddons) modalSummaryAddons.textContent = data.addonsList.length ? data.addonsList.join(' + ') : 'لا توجد باقات إضافية';
  if (modalSummaryTotal) modalSummaryTotal.textContent = `${formatEGP(data.total)} EGP`;

  // Build WhatsApp Message
  const waText = encodeURIComponent(
`السلام عليكم، أود تأكيد حجز سيارة من OM Motors:
• رقم الحجز المرجعي: ${data.refCode}
• العميل: ${data.name}
• الهاتف: ${data.phone}
• السيارة: ${data.modelName} (فئة ${data.trim})
• الطلاء الخارجي: ${data.paint}
• المقصورة الداخلية: ${data.leather}
• الإضافات: ${data.addonsList.length ? data.addonsList.join(', ') : 'لا توجد'}
• السعر الإجمالي: ${formatEGP(data.total)} ج.م
• صالة الاستلام: ${data.showroom}
• نظام السداد: ${data.payment}
برجاء تأكيد استلام الحجز والتواصل معي. شكراً!`
  );
  if (modalWhatsappBtn) {
    modalWhatsappBtn.href = `https://wa.me/201000000000?text=${waText}`;
  }

  if (orderModal) orderModal.classList.add('open');
  if (orderModalBackdrop) orderModalBackdrop.classList.add('active');
}

function closeOrderModal() {
  if (orderModal) orderModal.classList.remove('open');
  if (orderModalBackdrop) orderModalBackdrop.classList.remove('active');
}

if (modalCloseBtn) modalCloseBtn.onclick = closeOrderModal;
if (orderModalBackdrop) orderModalBackdrop.onclick = closeOrderModal;
if (modalPrintBtn) modalPrintBtn.onclick = () => window.print();

// Reservation Form Submission
if (reservationForm) {
  reservationForm.onsubmit = e => {
    e.preventDefault();
    const formData = new FormData(reservationForm);
    const clientName = formData.get('name') || 'العميل';
    const clientPhone = formData.get('phone') || '';
    const showroom = formData.get('showroom') || 'الشيخ زايد';
    const payment = formData.get('payment') || 'دفع نقدي كاش';

    // Random order reference code
    const randomCode = `OM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const basePrice = (cartState.prices[cartState.model] && cartState.prices[cartState.model][cartState.trim]) || 950000;
    let addonsTotal = 0;
    const addonsList = [];
    cartState.addons.forEach(id => {
      addonsTotal += (cartState.addonPrices[id] || 0);
      addonsList.push(cartState.addonTitles[id]);
    });

    const isOm1 = cartState.model === 'om1';
    const orderData = {
      refCode: randomCode,
      name: clientName,
      phone: clientPhone,
      showroom: showroom,
      payment: payment,
      modelName: isOm1 ? 'Antigravity OM1 SUV' : 'Antigravity OM2 Sedan',
      trim: cartState.trim,
      paint: cartState.paintName,
      leather: cartState.leatherName,
      addonsList: addonsList,
      total: basePrice + addonsTotal
    };

    closeDrawer();
    openOrderModal(orderData);
  };
}

// Initial Call
updateDrawerUI();




