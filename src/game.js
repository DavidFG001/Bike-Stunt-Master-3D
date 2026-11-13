import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 35, 150);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 300);
camera.position.set(0, 5, 11);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x567080, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2.3);
sun.position.set(-5, 12, 8);
sun.castShadow = true;
scene.add(sun);

const mat = (color, roughness=0.7, metalness=0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const groundMat = mat(0x2c8b57);
const roadMat = mat(0x30343b);
const redMat = mat(0xe33125, 0.35, 0.45);
const blackMat = mat(0x171a20, 0.4, 0.25);
const metalMat = mat(0xb8c3cc, 0.25, 0.8);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), groundMat);
ground.rotation.x = -Math.PI/2; ground.position.y = -0.12; ground.receiveShadow = true; scene.add(ground);

const road = new THREE.Mesh(new THREE.BoxGeometry(8, 0.25, 160), roadMat);
road.position.set(0, 0, -55); road.receiveShadow = true; scene.add(road);

for (let z=15; z>-135; z-=10) {
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 4), mat(0xffffff));
  stripe.position.set(0, 0.14, z-5); scene.add(stripe);
}
for (const x of [-4.15,4.15]) {
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.55,160), redMat);
  rail.position.set(x,0.4,-55); scene.add(rail);
}

function makeBike() {
  const bike = new THREE.Group();
  const wheelGeo = new THREE.TorusGeometry(0.48,0.12,12,24);
  for (const z of [-0.85,0.85]) {
    const wheel = new THREE.Mesh(wheelGeo, blackMat);
    wheel.rotation.y = Math.PI/2; wheel.position.set(0,0.62,z); wheel.castShadow = true; bike.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.18,16), metalMat);
    hub.rotation.z = Math.PI/2; hub.position.set(0,0.62,z); bike.add(hub);
  }
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.48,0.42,1.35), redMat);
  body.position.set(0,1.05,0); body.castShadow = true; bike.add(body);
  const tank = new THREE.Mesh(new THREE.SphereGeometry(0.36,20,12), redMat);
  tank.scale.set(0.8,0.65,1.2); tank.position.set(0,1.35,-0.12); bike.add(tank);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55,0.15,0.65), blackMat);
  seat.position.set(0,1.48,0.55); bike.add(seat);
  const rider = new THREE.Mesh(new THREE.SphereGeometry(0.28,18,14), blackMat);
  rider.position.set(0,1.95,0.25); rider.scale.set(0.9,1.15,0.9); bike.add(rider);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.27,18,14), mat(0xf2f2f2,0.3,0.1));
  helmet.position.set(0,2.28,0.1); bike.add(helmet);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,1.1,10), metalMat);
  handle.rotation.z = Math.PI/2; handle.position.set(0,1.55,-0.62); bike.add(handle);
  bike.position.set(0,0,3);
  return bike;
}
const bike = makeBike(); scene.add(bike);

function makeRamp(z, height=2.3) {
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(5,0.35,7), mat(0xf08b25,0.5,0.15));
  ramp.position.set(0,height/2,z); ramp.rotation.x = -0.22; ramp.castShadow = true; scene.add(ramp);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(5,0.18,0.5), redMat);
  lip.position.set(0,height,z-3.1); scene.add(lip);
}
makeRamp(-20,2.2);
makeRamp(-62,3.0);
makeRamp(-105,2.5);

const obstacles = [];
for (const z of [-38,-80,-124]) {
  const block = new THREE.Mesh(new THREE.BoxGeometry(1.6,1.1,1.5), mat(0xf4bd27));
  block.position.set((Math.random()-.5)*4,0.7,z); block.castShadow = true; scene.add(block); obstacles.push(block);
}

let running=false, steer=0, jumpVelocity=0, score=0, distance=0, last=performance.now();
const $ = id => document.getElementById(id);
function start() { running=true; $('message').textContent='Ride carefully and hit the ramps!'; }
function restart() { bike.position.set(0,0,3); bike.rotation.set(0,0,0); score=0; distance=0; running=false; $('message').textContent='Tap RIDE to start'; }
$('ride').addEventListener('click',start);
$('jump').addEventListener('pointerdown',()=>{ if(running && bike.position.y<0.08) jumpVelocity=8; });
function bindHold(id, value) {
  const el=$(id);
  el.addEventListener('pointerdown',e=>{e.preventDefault();steer=value;});
  for (const ev of ['pointerup','pointercancel','pointerleave']) el.addEventListener(ev,()=>{if(steer===value)steer=0;});
}
bindHold('left',-1); bindHold('right',1);
addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft') steer=-1;
  if(e.key==='ArrowRight') steer=1;
  if(e.code==='Space' && running && bike.position.y<0.08) jumpVelocity=8;
  if(e.key.toLowerCase()==='r') restart();
});
addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key))steer=0;});

function animate(now) {
  requestAnimationFrame(animate);
  const dt=Math.min((now-last)/1000,0.04); last=now;
  if(running) {
    distance += 18*dt; score += Math.max(0,Math.floor(Math.abs(steer)*dt*15));
    bike.position.x = THREE.MathUtils.clamp(bike.position.x + steer*7*dt,-3.25,3.25);
    bike.rotation.z = THREE.MathUtils.lerp(bike.rotation.z,-steer*0.22,0.12);
    bike.position.z -= 18*dt;
    if(bike.position.z < -130) bike.position.z = 3;
    jumpVelocity -= 18*dt; bike.position.y += jumpVelocity*dt;
    if(bike.position.y<0){bike.position.y=0;jumpVelocity=0;}
    bike.rotation.x = bike.position.y>0.2 ? -0.18 : 0;
    $('distance').textContent=Math.floor(distance);
    $('score').textContent=score;
    for(const ob of obstacles) {
      if(Math.abs(bike.position.z-ob.position.z)<1.1 && Math.abs(bike.position.x-ob.position.x)<1.2 && bike.position.y<0.7) {
        running=false; $('message').textContent='Crash! Press R to try again.';
      }
    }
  }
  camera.position.x=THREE.MathUtils.lerp(camera.position.x,bike.position.x*0.28,0.04);
  camera.position.y=THREE.MathUtils.lerp(camera.position.y,5+bike.position.y*0.3,0.04);
  camera.lookAt(bike.position.x*0.3,1.1+bike.position.y,-7);
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
