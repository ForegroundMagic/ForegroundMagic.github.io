export const textTemplates = [
  {
    type: 'Text',
    key: 'boldStatement',
    name: 'Bold Statement',
    tags: ['bold', 'headline', 'statement'],
    width: 260,
    height: 120,
    text: 'Reach for the Stars',
    fontSize: 28,
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 700,
    fontStyle: 'normal',
    fill: '#ffffff',
    renderPreview(container) {
      if (!container) return;
      container.innerHTML = '';
      const preview = document.createElement('div');
      preview.className = 'gallery-text-preview';
      preview.style.fontFamily = "'Montserrat', sans-serif";
      preview.style.fontWeight = '700';
      preview.textContent = 'Reach for the Stars';
      container.appendChild(preview);
    }
  },
  {
    type: 'Text',
    key: 'scripted',
    name: 'Scripted',
    tags: ['script', 'elegant', 'handwritten'],
    width: 240,
    height: 140,
    text: 'Dream Big',
    fontSize: 36,
    fontFamily: "'Georgia', serif",
    fontWeight: 600,
    fontStyle: 'italic',
    fill: '#ffe066',
    renderPreview(container) {
      if (!container) return;
      container.innerHTML = '';
      const preview = document.createElement('div');
      preview.className = 'gallery-text-preview';
      preview.style.fontFamily = "'Georgia', serif";
      preview.style.fontWeight = '600';
      preview.style.fontStyle = 'italic';
      preview.textContent = 'Dream Big';
      container.appendChild(preview);
    }
  },
  {
    type: 'Text',
    key: 'tagline',
    name: 'Tagline',
    tags: ['tagline', 'modern', 'clean'],
    width: 280,
    height: 110,
    text: 'Cosmic Explorer',
    fontSize: 26,
    fontFamily: "'Roboto', sans-serif",
    fontWeight: 500,
    fontStyle: 'normal',
    fill: '#7c5cff',
    renderPreview(container) {
      if (!container) return;
      container.innerHTML = '';
      const preview = document.createElement('div');
      preview.className = 'gallery-text-preview';
      preview.style.fontFamily = "'Roboto', sans-serif";
      preview.style.fontWeight = '500';
      preview.style.color = '#7c5cff';
      preview.textContent = 'Cosmic Explorer';
      container.appendChild(preview);
    }
  }
];
