export const defaultProjects = {
  alorun: {name:'Alorun', summary:'An adaptive AI life companion in development, designed to understand your goals and help turn intentions into plans and authorized actions.', category:'IN DEVELOPMENT · MOBILE APP', image:'/alorun-logo.png'},
  craftors: {name:'Craftors.ai', summary:'An AI-powered platform in development to turn ideas into manufacturable hardware designs and bring physical products to your doorstep.', category:'IN DEVELOPMENT · HARDWARE', image:'/craftors-logo.png'}
};
export const dateLabel = value => new Date(value + 'T12:00:00Z').toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export async function request(url, options) { const response = await fetch(url,options); const data = await response.json(); if(!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.'); return data; }
export async function uploadImage(file) { if (!file) throw new Error('Choose an image first.'); if (file.size > 5*1024*1024) throw new Error('Image must be 5 MB or smaller.'); return (await request('/api/admin/upload',{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:file})).url; }
