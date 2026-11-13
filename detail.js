const el = document.querySelector('#detail-content');
const params = new URLSearchParams(location.search);
const projects = { alorun: { name: 'Alorun', summary: 'An adaptive AI life companion in development, designed to understand your goals and help turn intentions into plans and authorized actions.', logo: '/alorun-logo.png' }, craftors: { name: 'Craftors.ai', summary: 'An AI-powered platform in development to turn ideas into manufacturable hardware designs and bring physical products to your doorstep.', logo: '/craftors-logo.png' } };
function text(tag, content, className) { const node = document.createElement(tag); node.textContent = content; if (className) node.className = className; return node; }
function dateLabel(value) { return new Date(value + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
function renderEntry(entry) { const card = document.createElement('article'); card.className = 'update-card'; card.append(text('time', dateLabel(entry.date), 'update-date'), text('h2', entry.title), text('p', entry.body, 'entry-body')); return card; }
function renderArticle(content) {
  const container = document.createElement('div'); container.className = 'entry-body article-body';
  function inline(parent, value) {
    const pattern = /(\*\*([^*\n]+)\*\*|\*([^*\n]+)\*)/g; let last = 0, match;
    while ((match = pattern.exec(value))) { parent.append(document.createTextNode(value.slice(last, match.index))); const node = document.createElement(match[2] ? 'strong' : 'em'); node.textContent = match[2] || match[3]; parent.append(node); last = pattern.lastIndex; }
    parent.append(document.createTextNode(value.slice(last)));
  }
  const lines = content.split(/\r?\n/); let paragraph = [], quote = [];
  function flushParagraph() { if (!paragraph.length) return; const p = document.createElement('p'); paragraph.forEach((line, index) => { if (index) p.append(document.createElement('br')); inline(p,line); }); container.append(p); paragraph = []; }
  function flushQuote() { if (!quote.length) return; const block = document.createElement('blockquote'); inline(block,quote.join(' ')); container.append(block); quote = []; }
  for (const line of lines) {
    const image = line.match(/^!\[([^\]]*)\]\((\/uploads\/[a-f0-9]{32}\.(?:png|jpg|webp|gif))\)$/);
    if (image) { flushParagraph(); flushQuote(); const img = document.createElement('img'); img.src = image[2]; img.alt = image[1]; img.className = 'article-image'; img.loading = 'lazy'; container.append(img); }
    else if (/^>\s?/.test(line)) { flushParagraph(); quote.push(line.replace(/^>\s?/,'')); }
    else { flushQuote(); if (!line.trim()) flushParagraph(); else paragraph.push(line); }
  }
  flushParagraph(); flushQuote(); return container;
}
fetch('/api/content').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(data => {
  el.replaceChildren();
  if (data.profileImage) document.querySelectorAll('.profile-photo').forEach(img => { img.src = data.profileImage; });
  if (location.pathname === '/project') {
    const id = params.get('id'), original = projects[id], info = data.projectInfo?.[id], project = original && (info ? { name: info.name, summary: info.summary, logo: info.image } : original); if (!project) { el.append(text('h1','Project not found')); return; }
    document.title = `${project.name} — Akmal`; el.append(text('p', 'PROJECT IN PROGRESS', 'detail-kicker'), text('h1', project.name), text('p', project.summary, 'detail-lead'));
    const img = document.createElement('img'); img.src = project.logo; img.alt = `${project.name} logo`; img.className = `detail-logo ${id}`; el.append(img, text('h2','Project updates','updates-heading'));
    const entries = [...data.projects[id]].sort((a,b) => b.date.localeCompare(a.date)); if (!entries.length) el.append(text('p','No updates yet. Check back soon.', 'empty-message')); else entries.forEach(e => el.append(renderEntry(e)));
  } else {
    const article = data.articles.find(a => a.id === params.get('id')); if (!article) { el.append(text('h1','Article not found'), text('p','This article is unavailable.')); return; }
    document.title = `${article.title} — Akmal`; el.append(text('p', dateLabel(article.date), 'detail-kicker'), text('h1', article.title), renderArticle(article.body));
  }
}).catch(() => { el.replaceChildren(text('p','Could not load this page. Please try again.')); });
