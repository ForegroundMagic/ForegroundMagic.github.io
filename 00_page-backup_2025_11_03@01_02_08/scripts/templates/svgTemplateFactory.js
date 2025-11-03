const svgCache = new Map();

async function fetchSvg(assetPath) {
  if (!assetPath) {
    throw new Error('Asset path is required to load an SVG.');
  }

  if (svgCache.has(assetPath)) {
    const cached = svgCache.get(assetPath);
    return cached.cloneNode(true);
  }

  const response = await fetch(assetPath);
  if (!response.ok) {
    throw new Error(`Failed to load SVG asset at ${assetPath} (${response.status})`);
  }

  const svgText = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svg = doc.documentElement;
  svgCache.set(assetPath, svg);
  return svg.cloneNode(true);
}

function preparePreviewSvg(svg) {
  const previewSvg = svg.cloneNode(true);
  previewSvg.classList.add('gallery-svg-preview');
  previewSvg.removeAttribute('width');
  previewSvg.removeAttribute('height');
  previewSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  return previewSvg;
}

export function createSvgTemplate(type, config) {
  const {
    key,
    name,
    tags = [],
    width,
    height,
    assetPath,
    colorAttribute = 'fill',
    baseColor,
    accentColor
  } = config;

  return {
    type,
    key,
    name,
    tags,
    width,
    height,
    assetPath,
    colorAttribute,
    baseColor,
    accentColor,
    async renderPreview(container) {
      if (!container) return;
      container.innerHTML = '';
      try {
        const svg = await fetchSvg(assetPath);
        container.appendChild(preparePreviewSvg(svg));
      } catch (error) {
        console.error(error);
        const fallback = document.createElement('div');
        fallback.className = 'gallery-item-preview-error';
        fallback.textContent = 'Preview unavailable';
        container.appendChild(fallback);
      }
    },
    async createContent(node) {
      if (!node) return null;
      try {
        const svg = await fetchSvg(assetPath);
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        const imported = node.ownerDocument.importNode(svg, true);
        if (width) {
          imported.setAttribute('width', width);
        }
        if (height) {
          imported.setAttribute('height', height);
        }
        imported.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        const colorElement =
          imported.querySelector('[data-color-primary]') || imported.firstElementChild || null;
        if (colorElement && baseColor) {
          colorElement.setAttribute(colorAttribute, baseColor);
        }
        if (accentColor) {
          imported.querySelectorAll('[data-color-accent]').forEach((element) => {
            element.setAttribute('fill', accentColor);
          });
        }
        node.appendChild(imported);
        return { colorElement };
      } catch (error) {
        console.error(error);
        return null;
      }
    }
  };
}

export function createTextTemplate(config) {
  const {
    key,
    name,
    tags = [],
    width,
    height,
    previewAsset,
    text,
    fontFamily,
    fontSize,
    fontWeight = 600,
    fontStyle = 'normal',
    fill = '#ffffff'
  } = config;

  return {
    type: 'Text',
    key,
    name,
    tags,
    width,
    height,
    text,
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    fill,
    async renderPreview(container) {
      if (!container) return;
      container.innerHTML = '';
      if (!previewAsset) {
        const fallback = document.createElement('div');
        fallback.className = 'gallery-text-preview';
        fallback.textContent = text;
        container.appendChild(fallback);
        return;
      }
      try {
        const svg = await fetchSvg(previewAsset);
        container.appendChild(preparePreviewSvg(svg));
      } catch (error) {
        console.error(error);
        const fallback = document.createElement('div');
        fallback.className = 'gallery-text-preview';
        fallback.textContent = text;
        container.appendChild(fallback);
      }
    }
  };
}
