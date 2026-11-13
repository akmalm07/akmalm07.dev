document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelector('#contact-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget, status = form.querySelector('.form-status'), button = form.querySelector('button');
  button.disabled = true; status.textContent = 'Sending your message…';
  try {
    const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))), signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
    form.reset(); status.textContent = 'Thanks for reaching out! Your message has been sent.';
  } catch (error) { status.textContent = error.name === 'TimeoutError' ? 'Sending took too long. Please check your connection and try again.' : (error.message === 'Failed to fetch' ? 'Could not connect. Check your connection and try again.' : error.message || 'Could not send your message. Please try again.'); }
  finally { button.disabled = false; }
});
fetch('/api/content').then(r => r.json()).then(data => {
  if (data.profileImage) document.querySelectorAll('.brand-photo, .profile-photo').forEach(img => { img.src = data.profileImage; });
  if (data.projectInfo) for (const id of ['alorun', 'craftors']) {
    const project = data.projectInfo[id], card = document.querySelector(`[data-project="${id}"]`);
    if (!project || !card) continue;
    card.querySelector('h3').textContent = project.name; card.querySelector('.project-main p').textContent = project.summary;
    card.querySelector('.project-meta').textContent = project.category; const link = card.querySelector('.project-card-link'); link.setAttribute('aria-label', `View ${project.name} progress`);
    const image = card.querySelector('.project-logo'); image.src = project.image; image.alt = `${project.name} image`;
  }
  const calendar = document.querySelector('#calendar-list');
  calendar.replaceChildren();
  if (data.googleCalendarId) {
    const url = new URL('https://calendar.google.com/calendar/embed');
    url.searchParams.set('src', data.googleCalendarId);
    const frame = document.createElement('iframe');
    frame.className = 'calendar-frame'; frame.title = 'Google Calendar'; frame.src = url.toString(); frame.loading = 'lazy';
    calendar.append(frame);
  } else {
    const empty = document.createElement('p'); empty.className = 'calendar-empty'; empty.textContent = 'Calendar coming soon.'; calendar.append(empty);
  }
  const journal = document.querySelector('.journal-empty');
  if (!journal || !data.articles.length) return;
  const list = document.createElement('div'); list.className = 'article-list';
  [...data.articles].sort((a,b) => b.date.localeCompare(a.date)).forEach(article => { const a = document.createElement('a'); a.className = 'article-row'; a.href = '/article?id=' + encodeURIComponent(article.id); const date = document.createElement('span'); date.className='project-meta'; date.textContent = new Date(article.date + 'T12:00:00Z').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}); const h = document.createElement('h3'); h.textContent=article.title; const more = document.createElement('span'); more.textContent='Read article ↗'; a.append(date,h,more); list.append(a); }); journal.replaceWith(list);
}).catch(() => { document.querySelector('#calendar-list').textContent = 'The calendar could not be loaded. Please try again later.'; });

const githubRepositories = document.querySelector('#github-repositories');
fetch('https://api.github.com/users/akmalm07/repos?sort=pushed&per_page=100', { headers: { Accept: 'application/vnd.github+json' } })
  .then(response => { if (!response.ok) throw new Error('GitHub unavailable'); return response.json(); })
  .then(repositories => {
    if (!Array.isArray(repositories)) throw new Error('Invalid GitHub response');
    const projects = repositories.filter(repo => !repo.fork && !repo.archived).slice(0, 6);
    githubRepositories.replaceChildren();
    if (!projects.length) { const status = document.createElement('p'); status.className = 'github-status'; status.textContent = 'No public projects to show yet.'; githubRepositories.append(status); return; }
    projects.forEach(repo => {
      const article = document.createElement('article'); article.className = 'github-repository';
      const heading = document.createElement('h3'); const link = document.createElement('a');
      link.href = 'https://github.com/akmalm07/' + encodeURIComponent(repo.name); link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = repo.name;
      heading.append(link); const description = document.createElement('p'); description.textContent = repo.description || 'View this project on GitHub.';
      const meta = document.createElement('span'); meta.className = 'github-language'; meta.textContent = repo.language || 'Project';
      article.append(heading, description, meta); githubRepositories.append(article);
    });
  })
  .catch(() => { githubRepositories.replaceChildren(); const status = document.createElement('p'); status.className = 'github-status'; status.textContent = 'Projects could not be loaded right now. Visit GitHub to see them.'; githubRepositories.append(status); });
