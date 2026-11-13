const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const root = __dirname;
try { for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim(); } } catch (e) { if (e.code !== 'ENOENT') throw e; }
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(root, 'data'), dataFile = path.join(dataDir, 'content.json'), passwordFile = path.join(root, '.admin-password');
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({ projects: { alorun: [], craftors: [] }, articles: [], calendar: [], googleCalendarId: '' }, null, 2));
if (!process.env.ADMIN_PASSWORD && !fs.existsSync(passwordFile)) { try { fs.writeFileSync(passwordFile, crypto.randomBytes(24).toString('base64url'), { mode: 0o600, flag: 'wx' }); } catch (e) { if (e.code !== 'EEXIST') throw e; } }
const adminPassword = process.env.ADMIN_PASSWORD || fs.readFileSync(passwordFile, 'utf8').trim();
const sessions = new Map();
function json(res, code, value) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); }
function readBody(req) { return new Promise((resolve, reject) => { let chunks = [], size = 0; req.on('data', chunk => { size += chunk.length; if (size > 200000) { reject(new Error('Request too large')); req.destroy(); } else chunks.push(chunk); }); req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new Error('Invalid request')); } }); req.on('error', reject); }); }
function sameOrigin(req) { try { const origin = new URL(req.headers.origin); return ['http:', 'https:'].includes(origin.protocol) && origin.host === req.headers.host; } catch { return false; } }
function authorized(req) { const token = (req.headers.cookie || '').split('; ').find(v => v.startsWith('admin_session='))?.slice(14); const expires = sessions.get(token); if (!expires || expires < Date.now()) { sessions.delete(token); return false; } return true; }
function validEntry(entry) { return entry && typeof entry.id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(entry.id) && typeof entry.title === 'string' && entry.title.trim().length > 0 && entry.title.length <= 150 && typeof entry.body === 'string' && entry.body.trim().length > 0 && entry.body.length <= 15000 && typeof entry.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.date); }
const uploadDir = path.join(dataDir, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
function readUpload(req) { return new Promise((resolve, reject) => { const chunks = []; let size = 0, tooLarge = false; req.on('data', chunk => { size += chunk.length; if (size > 5 * 1024 * 1024) { tooLarge = true; chunks.length = 0; } else if (!tooLarge) chunks.push(chunk); }); req.on('end', () => tooLarge ? reject(new Error('Image must be 5 MB or smaller.')) : resolve(Buffer.concat(chunks))); req.on('error', reject); }); }
function imageExtension(bytes) { if (bytes.length >= 8 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png'; if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg'; if (bytes.length >= 12 && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') return 'webp'; if (bytes.length >= 6 && ['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6))) return 'gif'; return null; }
function validImagePath(value) { return typeof value === 'string' && (/^\/uploads\/[a-f0-9]{32}\.(png|jpg|webp|gif)$/.test(value) || ['/akmal-photo.jpg','/alorun-logo.png','/craftors-logo.png'].includes(value)); }
const files = { '/': 'index.html', '/about': 'index.html', '/blog': 'index.html', '/project': 'detail.html', '/article': 'detail.html', '/admin': 'admin.html', '/styles.css': 'styles.css', '/app.js': 'app.js', '/nav.js': 'nav.js', '/theme.js': 'theme.js', '/detail.js': 'detail.js', '/admin.js': 'admin.js', '/solar.js': 'solar.js', '/three.module.js': 'node_modules/three/build/three.module.js', '/three.core.js': 'node_modules/three/build/three.core.js', '/cosmic-hero.png': 'cosmic-hero.png', '/alorun-logo.png': 'alorun-logo.png', '/craftors-logo.png': 'craftors-logo.png', '/akmal-photo.jpg': 'akmal-photo.jpg' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname === '/blog') { res.writeHead(301, { Location: '/#journal' }); return res.end(); }
    if ((req.method === 'GET' || req.method === 'HEAD') && /^\/uploads\/[a-f0-9]{32}\.(png|jpg|webp|gif)$/.test(url.pathname)) {
      const file = path.join(uploadDir, path.basename(url.pathname)); if (!fs.existsSync(file)) return json(res, 404, { error: 'Image not found.' });
      const ext = path.extname(file); const types = {'.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};
      res.writeHead(200, {'Content-Type':types[ext], 'X-Content-Type-Options':'nosniff', 'Cache-Control':'public, max-age=31536000, immutable'}); if (req.method === 'HEAD') return res.end(); return fs.createReadStream(file).pipe(res);
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/upload') {
      if (!sameOrigin(req) || !authorized(req)) return json(res, 403, {error:'Please sign in again.'});
      let bytes; try { bytes = await readUpload(req); } catch (error) { return json(res, 400, {error:error.message}); }
      const ext = imageExtension(bytes); if (!ext) return json(res, 400, {error:'Choose a PNG, JPEG, WebP, or GIF image.'});
      const name = crypto.randomBytes(16).toString('hex') + '.' + ext; fs.writeFileSync(path.join(uploadDir, name), bytes, {flag:'wx'}); return json(res, 201, {url:'/uploads/' + name});
    }
    if (req.method === 'GET' && url.pathname === '/api/content') { const data = JSON.parse(fs.readFileSync(dataFile, 'utf8')); data.articles = data.articles.filter(a => a.published); return json(res, 200, data); }
    if (req.method === 'GET' && url.pathname === '/api/admin/content') { if (!authorized(req)) return json(res, 401, { error: 'Please sign in.' }); return json(res, 200, JSON.parse(fs.readFileSync(dataFile, 'utf8'))); }
    if (req.method === 'POST' && url.pathname === '/api/admin/login') {
      if (!sameOrigin(req)) return json(res, 403, { error: 'Invalid request origin.' });
      const body = await readBody(req); const a = Buffer.from(typeof body.password === 'string' ? body.password : ''), b = Buffer.from(adminPassword);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return json(res, 401, { error: 'Incorrect password.' });
      const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, Date.now() + 8 * 60 * 60 * 1000);
      res.setHeader('Set-Cookie', `admin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`); return json(res, 200, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/logout') { if (!sameOrigin(req)) return json(res, 403, { error: 'Invalid request origin.' }); const token = (req.headers.cookie || '').split('; ').find(v => v.startsWith('admin_session='))?.slice(14); sessions.delete(token); res.setHeader('Set-Cookie', 'admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return json(res, 200, { ok: true }); }
    if (req.method === 'GET' && url.pathname === '/api/admin/session') return json(res, authorized(req) ? 200 : 401, { authenticated: authorized(req) });
    if (req.method === 'PUT' && url.pathname === '/api/admin/content') {
      if (!sameOrigin(req) || !authorized(req)) return json(res, 403, { error: 'Please sign in again.' });
      const body = await readBody(req); if ((body.profileImage !== undefined && !validImagePath(body.profileImage)) || (body.projectInfo !== undefined && (!body.projectInfo || ['alorun','craftors'].some(id => { const p = body.projectInfo[id]; return !p || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 150 || typeof p.summary !== 'string' || !p.summary.trim() || p.summary.length > 1000 || typeof p.category !== 'string' || p.category.length > 120 || !validImagePath(p.image); })))) return json(res, 400, {error:'Please check the project details and images.'}); if (body.googleCalendarId !== undefined && (typeof body.googleCalendarId !== 'string' || body.googleCalendarId.length > 254 || (body.googleCalendarId !== '' && !/^[^\s<>"']+@[^\s<>"']+$/.test(body.googleCalendarId)))) return json(res, 400, { error: 'Please enter a valid Google Calendar ID.' }); if (!body.projects || !Array.isArray(body.projects.alorun) || !Array.isArray(body.projects.craftors) || !Array.isArray(body.articles) || !Array.isArray(body.calendar) || [...body.projects.alorun, ...body.projects.craftors, ...body.articles, ...body.calendar].some(e => !validEntry(e)) || body.articles.some(e => typeof e.published !== 'boolean') || [...body.projects.alorun, ...body.projects.craftors, ...body.articles, ...body.calendar].length > 1000) return json(res, 400, { error: 'Please provide a title, date, and text for every entry.' });
      const temp = dataFile + '.tmp'; fs.writeFileSync(temp, JSON.stringify(body, null, 2)); fs.renameSync(temp, dataFile); return json(res, 200, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/contact') {
      const { name, email, message = '' } = await readBody(req);
      if (typeof name !== 'string' || !name.trim() || name.length > 120 || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof message !== 'string' || message.length > 5000) return json(res, 400, { error: 'Please enter a valid name and email address.' });
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || !process.env.CONTACT_TO) return json(res, 503, { error: 'Email is not set up yet. Please check back soon.' });
      await nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } }).sendMail({ from: process.env.GMAIL_USER, to: process.env.CONTACT_TO, replyTo: email, subject: 'New portfolio inquiry', text: `Name: ${name.trim()}\nEmail: ${email}\n\n${message.trim() || '(No project details provided)'}` }); return json(res, 200, { ok: true });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed.' });
    const file = files[url.pathname]; if (!file) { res.writeHead(404); return res.end('Not found'); }
    const type = file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.css') ? 'text/css; charset=utf-8' : file.endsWith('.png') ? 'image/png' : file.endsWith('.jpg') ? 'image/jpeg' : 'application/javascript; charset=utf-8';
    res.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' }); if (req.method === 'HEAD') return res.end(); fs.createReadStream(path.join(root, file)).pipe(res);
  } catch (error) { console.error('Request failed:', error.message); if (!res.headersSent) json(res, 500, { error: 'Something went wrong. Please try again.' }); }
});
server.listen(process.env.PORT || 5050, '127.0.0.1', () => console.log(`Portfolio running on http://localhost:${process.env.PORT || 5050}`));
