/* Shared storage and DOM code for all three pages. */
'use strict';
const message = document.querySelector('#message');
function showMessage(text) { if (message) message.textContent = text; }
function readEntries() {
  const saved = localStorage.getItem('entries');
  if (!saved) return [];
  const entries = JSON.parse(saved);
  if (!Array.isArray(entries) || entries.some(entry => !entry || typeof entry.title !== 'string' || typeof entry.body !== 'string')) {
    throw new Error('Invalid diary data');
  }
  return entries;
}
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Undated' : date.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});
}
function makeCard(entry) {
  const card = document.createElement('article');
  card.className = 'card';
  const date = document.createElement('p');
  date.className = 'date';
  date.textContent = formatDate(entry.createdAt);
  const title = document.createElement('h2');
  title.textContent = entry.title;
  const body = document.createElement('p');
  body.className = 'content';
  body.textContent = entry.body; // textContent keeps typed HTML as harmless text.
  card.append(date, title, body);
  if (Array.isArray(entry.tags)) {
    const tags = document.createElement('div');
    tags.className = 'tags';
    entry.tags.forEach(value => {
      const tag = document.createElement('span');
      tag.className = 'tag'; tag.textContent = String(value); tags.append(tag);
    });
    card.append(tags);
  }
  return card;
}
const container = document.querySelector('#entries');
if (container) {
  try {
    const entries = readEntries();
    // ISO timestamps sort chronologically. Newest first, without changing saved data.
    entries.sort((a,b) => (Date.parse(b.createdAt)||0) - (Date.parse(a.createdAt)||0));
    const visibleEntries = container.classList.contains('grid') ? entries.slice(0, 5) : entries;
    container.replaceChildren();
    if (!visibleEntries.length) {
      const empty = document.createElement('p');
      empty.className = 'empty'; empty.textContent = 'Your story starts here. Create your first entry.';
      container.append(empty);
    }
    visibleEntries.forEach(entry => container.append(makeCard(entry)));
  } catch (error) { showMessage('Your saved entries could not be read. Check that browser storage is available. Existing data has not been changed.'); }
}
const form = document.querySelector('#entry-form');
const saveButton = document.querySelector('#save-entry');
if (form && saveButton) {
  document.querySelector('#today').textContent = formatDate(new Date().toISOString());
  form.addEventListener('submit', event => {
    event.preventDefault();
    const titleInput = document.querySelector('#title');
    const bodyInput = document.querySelector('#body');
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    if (!title || !body) {
      showMessage('Please add a title and a reflection before saving.');
      (!title ? titleInput : bodyInput).focus(); return;
    }
    saveButton.disabled = true;
    try {
      const entries = readEntries();
      entries.push({title, body, createdAt: new Date().toISOString(), tags: document.querySelector('#tags').value.split(',').map(tag => tag.trim()).filter(Boolean)});
      localStorage.setItem('entries', JSON.stringify(entries));
      window.location.href = 'index.html';
    } catch (error) {
      showMessage('This entry could not be saved. Browser storage may be blocked, full, or contain unreadable data. Keep this page open and copy your reflection before leaving.');
      saveButton.disabled = false;
    }
  });
}
