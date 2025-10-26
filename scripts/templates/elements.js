import { svgNS } from '../core/constants.js';

export const elementTemplates = [
  (() => {
    function draw(target, color = '#f9f871') {
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M70 0 L85 55 L140 70 L85 85 L70 140 L55 85 L0 70 L55 55 Z');
      path.setAttribute('fill', color);
      target.appendChild(path);
    }

    return {
      type: 'Element',
      key: 'sparkle',
      name: 'Sparkle',
      tags: ['sparkle', 'highlight', 'accent'],
      width: 140,
      height: 140,
      baseColor: '#f9f871',
      renderPreview(container) {
        if (!container) return;
        container.innerHTML = '';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 140 140');
        svg.setAttribute('role', 'presentation');
        svg.classList.add('gallery-svg-preview');
        draw(svg);
        container.appendChild(svg);
      },
      createContent(node) {
        draw(node, '#f9f871');
      },
      colorAttribute: 'fill'
    };
  })(),
  (() => {
    function draw(target, strokeColor = '#7c5cff') {
      const ellipse = document.createElementNS(svgNS, 'ellipse');
      ellipse.setAttribute('cx', '90');
      ellipse.setAttribute('cy', '60');
      ellipse.setAttribute('rx', '85');
      ellipse.setAttribute('ry', '40');
      ellipse.setAttribute('fill', 'none');
      ellipse.setAttribute('stroke', strokeColor);
      ellipse.setAttribute('stroke-width', '12');
      ellipse.setAttribute('stroke-linecap', 'round');
      target.appendChild(ellipse);

      const accent = document.createElementNS(svgNS, 'ellipse');
      accent.setAttribute('cx', '110');
      accent.setAttribute('cy', '52');
      accent.setAttribute('rx', '24');
      accent.setAttribute('ry', '12');
      accent.setAttribute('fill', strokeColor);
      accent.setAttribute('opacity', '0.25');
      target.appendChild(accent);
    }

    return {
      type: 'Element',
      key: 'ring',
      name: 'Orbit Ring',
      tags: ['orbit', 'outline', 'accent'],
      width: 180,
      height: 120,
      baseColor: '#7c5cff',
      renderPreview(container) {
        if (!container) return;
        container.innerHTML = '';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 180 120');
        svg.setAttribute('role', 'presentation');
        svg.classList.add('gallery-svg-preview');
        draw(svg);
        container.appendChild(svg);
      },
      createContent(node) {
        draw(node, '#7c5cff');
      },
      colorAttribute: 'stroke'
    };
  })(),
  (() => {
    function draw(target, color = '#ff4d6d') {
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M80 132 L20 72 C-10 42 20 0 60 20 C80 30 90 45 80 65 C90 45 110 30 130 20 C170 0 200 42 170 72 Z');
      path.setAttribute('fill', color);
      path.setAttribute('opacity', '0.92');
      target.appendChild(path);

      const shine = document.createElementNS(svgNS, 'path');
      shine.setAttribute('d', 'M60 38 C72 30 90 30 100 46');
      shine.setAttribute('stroke', '#ffe0e6');
      shine.setAttribute('stroke-width', '6');
      shine.setAttribute('stroke-linecap', 'round');
      shine.setAttribute('fill', 'none');
      target.appendChild(shine);
    }

    return {
      type: 'Element',
      key: 'heart',
      name: 'Heart',
      tags: ['love', 'romantic', 'accent'],
      width: 160,
      height: 140,
      baseColor: '#ff4d6d',
      renderPreview(container) {
        if (!container) return;
        container.innerHTML = '';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 160 140');
        svg.setAttribute('role', 'presentation');
        svg.classList.add('gallery-svg-preview');
        draw(svg);
        container.appendChild(svg);
      },
      createContent(node) {
        draw(node, '#ff4d6d');
      },
      colorAttribute: 'fill'
    };
  })()
];
