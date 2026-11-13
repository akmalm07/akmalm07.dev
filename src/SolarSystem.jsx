import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function SolarSystem() {
  const container = useRef(null);
  useEffect(() => {
    const target = container.current;
    let renderer, observer, resizeObserver;
    try {
      const scene = new THREE.Scene(); scene.background = new THREE.Color(0x080716);
      const camera = new THREE.PerspectiveCamera(42, 1, .1, 200);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); target.append(renderer.domElement);
      scene.add(new THREE.AmbientLight(0x6e70af, 1.1)); scene.add(new THREE.PointLight(0xffd3ae, 120, 60));
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(2, 32, 24), new THREE.MeshBasicMaterial({ color: 0xffbd78 })));
      const solar = new THREE.Group(); scene.add(solar);
      const planets = [[3.6,.22,0xa6a3b4,.30],[5,.35,0xe5a662,.21],[6.6,.4,0x5caeea,.15],[8.1,.30,0xd97858,.11],[10.5,.85,0xd9b58e,.07],[13.2,.7,0xc1a8e4,.05]];
      const spheres = planets.map(([radius,size,color,speed], i) => {
        const orbit = new THREE.BufferGeometry().setFromPoints(Array.from({length:161}, (_,j) => {const a=j/160*Math.PI*2; return new THREE.Vector3(Math.cos(a)*radius,0,Math.sin(a)*radius)}));
        solar.add(new THREE.Line(orbit,new THREE.LineBasicMaterial({color:0x514471,transparent:true,opacity:.46})));
        const planet = new THREE.Mesh(new THREE.SphereGeometry(size,24,16),new THREE.MeshStandardMaterial({color,roughness:.84})); solar.add(planet);
        return {planet,radius,speed,offset:i*1.1};
      });
      const positions = new Float32Array(1200*3); for(let i=0;i<positions.length;i+=3){positions[i]=(Math.random()-.5)*150;positions[i+1]=(Math.random()-.5)*90;positions[i+2]=(Math.random()-.5)*150;}
      const stars=new THREE.BufferGeometry(); stars.setAttribute('position',new THREE.BufferAttribute(positions,3)); scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xd5c8ff,size:.12})));
      const resize=()=>{const w=target.clientWidth,h=target.clientHeight;if(!w||!h)return;const mobile=w<700;camera.position.set(mobile?0:-8,mobile?20:16,mobile?42:35);camera.lookAt(0,0,0);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)};
      resizeObserver=new ResizeObserver(resize);resizeObserver.observe(target);resize();
      let visible=true;observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting});observer.observe(target);
      const hero=document.querySelector('#home'); let dragging=false,lastX=0;
      const down=event=>{if((event.pointerType==='mouse'&&event.button!==0)||event.target.closest('a,button')||event.clientX<innerWidth*.55)return;dragging=true;lastX=event.clientX;hero.setPointerCapture(event.pointerId)};
      const move=event=>{if(!dragging)return;solar.rotation.y+=(event.clientX-lastX)*.006;lastX=event.clientX}; const end=()=>{dragging=false};
      if(hero){hero.addEventListener('pointerdown',down);hero.addEventListener('pointermove',move);for(const name of ['pointerup','pointercancel','lostpointercapture'])hero.addEventListener(name,end)}
      const reduced=matchMedia('(prefers-reduced-motion: reduce)');renderer.setAnimationLoop(time=>{if(!visible)return;const t=reduced.matches?0:time*.001;spheres.forEach(({planet,radius,speed,offset})=>planet.position.set(Math.cos(t*speed+offset)*radius,0,Math.sin(t*speed+offset)*radius));renderer.render(scene,camera)});
      return () => {if(hero){hero.removeEventListener('pointerdown',down);hero.removeEventListener('pointermove',move);for(const name of ['pointerup','pointercancel','lostpointercapture'])hero.removeEventListener(name,end)} observer.disconnect();resizeObserver.disconnect();renderer.setAnimationLoop(null);scene.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose()});renderer.dispose();renderer.domElement.remove()};
    } catch (error) { console.warn('3D scene unavailable:', error); renderer?.dispose(); observer?.disconnect(); resizeObserver?.disconnect(); }
  }, []);
  return <div id="solar-system" ref={container} aria-hidden="true" />;
}
