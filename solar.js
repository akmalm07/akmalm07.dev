import * as THREE from '/three.module.js';
const container = document.querySelector('#solar-system');
if (container) {
  try {
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x080716);
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 200); camera.position.set(0, 13, 30); camera.lookAt(0,0,0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); container.append(renderer.domElement);
    scene.add(new THREE.AmbientLight(0x6e70af, 1.1)); const light = new THREE.PointLight(0xffd3ae, 120, 60); scene.add(light);
    const sun = new THREE.Mesh(new THREE.SphereGeometry(2,32,24), new THREE.MeshBasicMaterial({color:0xffbd78})); scene.add(sun);
    const solar = new THREE.Group(); scene.add(solar);
    const planets = [[3.6,.22,0xa6a3b4,.30],[5,.35,0xe5a662,.21],[6.6,.4,0x5caeea,.15],[8.1,.30,0xd97858,.11],[10.5,.85,0xd9b58e,.07],[13.2,.7,0xc1a8e4,.05]];
    const spheres=[]; planets.forEach(([radius,size,color,speed],i)=>{ const orbit = new THREE.BufferGeometry().setFromPoints(Array.from({length:161},(_,j)=>{const a=j/160*Math.PI*2; return new THREE.Vector3(Math.cos(a)*radius,0,Math.sin(a)*radius)})); solar.add(new THREE.Line(orbit,new THREE.LineBasicMaterial({color:0x514471,transparent:true,opacity:.46}))); const planet=new THREE.Mesh(new THREE.SphereGeometry(size,24,16),new THREE.MeshStandardMaterial({color,roughness:.84})); solar.add(planet); spheres.push({planet,radius,speed,offset:i*1.1}); });
    const starPositions = new Float32Array(1200*3); for(let i=0;i<starPositions.length;i+=3){starPositions[i]=(Math.random()-.5)*150;starPositions[i+1]=(Math.random()-.5)*90;starPositions[i+2]=(Math.random()-.5)*150;} const stars=new THREE.BufferGeometry();stars.setAttribute('position',new THREE.BufferAttribute(starPositions,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xd5c8ff,size:.12})));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)'); let visible = true; let isMobile = false;
    function resize(){ const w=container.clientWidth,h=container.clientHeight; if(!w||!h)return; isMobile=w<700; camera.position.set(isMobile?0:-8,isMobile?20:16,isMobile?42:35);camera.lookAt(0,0,0);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false); } new ResizeObserver(resize).observe(container);resize();
    const observer = new IntersectionObserver(entries => { visible=entries[0].isIntersecting; }, {threshold:0}); observer.observe(container);
    let dragging=false, lastX=0; const hero=document.querySelector('#home'); if (hero) { hero.addEventListener('pointerdown',event=>{ if(event.pointerType==='mouse' && event.button!==0)return; if(event.target.closest('a,button') || event.clientX < innerWidth * .55)return; dragging=true; lastX=event.clientX; hero.setPointerCapture(event.pointerId); }); hero.addEventListener('pointermove',event=>{if(!dragging)return; solar.rotation.y+=(event.clientX-lastX)*.006;lastX=event.clientX;}); for(const name of ['pointerup','pointercancel','lostpointercapture'])hero.addEventListener(name,()=>{dragging=false;}); }
    renderer.setAnimationLoop(time=>{if(!visible)return;const t=reduced.matches?0:time*.001;spheres.forEach(({planet,radius,speed,offset})=>{planet.position.set(Math.cos(t*speed+offset)*radius,0,Math.sin(t*speed+offset)*radius);});renderer.render(scene,camera);});
  } catch (error) { console.warn('3D scene unavailable:', error); }
}
