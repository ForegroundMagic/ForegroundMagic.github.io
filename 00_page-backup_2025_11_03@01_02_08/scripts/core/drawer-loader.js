const DRAWER_VIEWS = [
  { file: 'layers.html' },
  { file: 'design.html' },
  { file: 'elements.html' },
  { file: 'text.html' },
  { file: 'adjust.html' }
];

async function fetchMarkup(file) {
  const url = new URL(`../../drawers/${file}`, import.meta.url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load drawer markup: ${file}`);
  }
  return response.text();
}

export async function loadDrawerViews() {
  const container = document.getElementById('drawer-body');
  if (!container) return;

  const fragments = await Promise.all(
    DRAWER_VIEWS.map(async ({ file }) => {
      const markup = await fetchMarkup(file);
      const template = document.createElement('template');
      template.innerHTML = markup.trim();
      return template.content;
    })
  );

  container.innerHTML = '';
  fragments.forEach((fragment) => {
    container.appendChild(fragment.cloneNode(true));
  });
}
