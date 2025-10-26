import { svgNS } from '../core/constants.js';

export const designTemplates = [
  (() => {
    function draw(target) {
      for (let i = 0; i < 12; i += 1) {
        const ray = document.createElementNS(svgNS, 'rect');
        ray.setAttribute('x', '118');
        ray.setAttribute('y', '12');
        ray.setAttribute('width', '12');
        ray.setAttribute('height', '60');
        ray.setAttribute('rx', '6');
        ray.setAttribute('fill', '#ffd27f');
        ray.setAttribute('opacity', '0.75');
        ray.setAttribute('transform', `rotate(${i * 30} 120 120)`);
        target.appendChild(ray);
      }

      const halo = document.createElementNS(svgNS, 'circle');
      halo.setAttribute('cx', '120');
      halo.setAttribute('cy', '120');
      halo.setAttribute('r', '86');
      halo.setAttribute('fill', '#ffb545');
      halo.setAttribute('opacity', '0.95');

      const glow = document.createElementNS(svgNS, 'circle');
      glow.setAttribute('cx', '120');
      glow.setAttribute('cy', '120');
      glow.setAttribute('r', '56');
      glow.setAttribute('fill', '#ff8a5b');
      glow.setAttribute('opacity', '0.9');

      const core = document.createElementNS(svgNS, 'circle');
      core.setAttribute('cx', '120');
      core.setAttribute('cy', '120');
      core.setAttribute('r', '32');
      core.setAttribute('fill', '#fff6d6');

      target.append(halo, glow, core);
    }

    return {
      type: 'Design',
      key: 'solarBurst',
      name: 'Solar Burst',
      tags: ['sun', 'bright', 'energy'],
      width: 240,
      height: 240,
      baseColor: '#ffb545',
      renderPreview(container) {
        if (!container) return;
        container.innerHTML = '';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 240 240');
        svg.setAttribute('role', 'presentation');
        svg.classList.add('gallery-svg-preview');
        draw(svg);
        container.appendChild(svg);
      },
      createContent(node) {
        draw(node);
      }
    };
  })(),
  (() => {
    function draw(target) {
      const backPeak = document.createElementNS(svgNS, 'polygon');
      backPeak.setAttribute('points', '10,200 110,60 210,200');
      backPeak.setAttribute('fill', '#3a556a');

      const frontPeak = document.createElementNS(svgNS, 'polygon');
      frontPeak.setAttribute('points', '60,200 150,80 230,200');
      frontPeak.setAttribute('fill', '#22333b');

      const snow1 = document.createElementNS(svgNS, 'polygon');
      snow1.setAttribute('points', '96,108 110,78 124,108');
      snow1.setAttribute('fill', '#f1f5f9');

      const snow2 = document.createElementNS(svgNS, 'polygon');
      snow2.setAttribute('points', '138,120 150,92 166,120');
      snow2.setAttribute('fill', '#f1f5f9');

      const ridge = document.createElementNS(svgNS, 'path');
      ridge.setAttribute('d', 'M20 200 C70 170 110 210 160 190 C190 178 210 200 230 196');
      ridge.setAttribute('stroke', '#9fb7c9');
      ridge.setAttribute('stroke-width', '8');
      ridge.setAttribute('stroke-linecap', 'round');
      ridge.setAttribute('fill', 'none');

      const ground = document.createElementNS(svgNS, 'rect');
      ground.setAttribute('x', '10');
      ground.setAttribute('y', '200');
      ground.setAttribute('width', '220');
      ground.setAttribute('height', '20');
      ground.setAttribute('rx', '10');
      ground.setAttribute('fill', '#4d6a79');

      target.append(backPeak, frontPeak, snow1, snow2, ridge, ground);
    }

    return {
      type: 'Design',
      key: 'mountainPeaks',
      name: 'Mountain Peaks',
      tags: ['nature', 'mountain', 'outdoor'],
      width: 240,
      height: 220,
      baseColor: '#3a556a',
      renderPreview(container) {
        if (!container) return;
        container.innerHTML = '';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 240 220');
        svg.setAttribute('role', 'presentation');
        svg.classList.add('gallery-svg-preview');
        draw(svg);
        container.appendChild(svg);
      },
      createContent(node) {
        draw(node);
      }
    };
  })(),
  (() => {
    function draw(target) {
      const sun = document.createElementNS(svgNS, 'circle');
      sun.setAttribute('cx', '180');
      sun.setAttribute('cy', '70');
      sun.setAttribute('r', '28');
      sun.setAttribute('fill', '#ffb347');
      sun.setAttribute('opacity', '0.85');

      const waveTop = document.createElementNS(svgNS, 'path');
      waveTop.setAttribute('d', 'M0 120 C40 100 80 120 120 110 C160 100 200 120 240 110 L240 140 L0 140 Z');
      waveTop.setAttribute('fill', '#80bfff');

      const waveMid = document.createElementNS(svgNS, 'path');
      waveMid.setAttribute('d', 'M0 150 C30 135 70 160 120 150 C170 140 210 160 240 150 L240 185 L0 185 Z');
      waveMid.setAttribute('fill', '#4d8dff');

      const waveLow = document.createElementNS(svgNS, 'path');
      waveLow.setAttribute('d', 'M0 185 C40 170 80 200 120 190 C160 180 200 205 240 192 L240 220 L0 220 Z');
      waveLow.setAttribute('fill', '#2f5bd8');

      target.append(sun, waveTop, waveMid, waveLow);
    }

    return {
      type: 'Design',
      key: 'oceanSwirl',
      name: 'Ocean Swirl',
      tags: ['water', 'wave', 'calm'],
      width: 240,
      height: 220,
      baseColor: '#4d8dff',
      renderPreview(container) {
        if (!container) return;
        container.innerHTML = '';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 240 220');
        svg.setAttribute('role', 'presentation');
        svg.classList.add('gallery-svg-preview');
        draw(svg);
        container.appendChild(svg);
      },
      createContent(node) {
        draw(node);
      }
    };
  })(),
  (() => {
    function draw(target) {
      const layers = ['#ff9ecd', '#c590ff', '#7d8fff', '#4ed4ff'];
      layers.forEach((color, index) => {
        const square = document.createElementNS(svgNS, 'rect');
        square.setAttribute('x', '70');
        square.setAttribute('y', '70');
        square.setAttribute('width', '100');
        square.setAttribute('height', '100');
        square.setAttribute('rx', '18');
        square.setAttribute('fill', color);
        square.setAttribute('opacity', `${0.75 - index * 0.12}`);
        square.setAttribute('transform', `rotate(${index * 15} 120 120)`);
        target.appendChild(square);
      });

      const bloom = document.createElementNS(svgNS, 'circle');
      bloom.setAttribute('cx', '120');
      bloom.setAttribute('cy', '120');
      bloom.setAttribute('r', '28');
      bloom.setAttribute('fill', '#ffffff');
      bloom.setAttribute('opacity', '0.9');
      target.appendChild(bloom);
    }

    return {
      type: 'Design',
      key: 'geoBloom',
      name: 'Geo Bloom',
      tags: ['geometric', 'abstract', 'modern'],
      width: 240,
      height: 240,
      baseColor: '#7d8fff',
      renderPreview(container) {
        if (!container) return;
        container.innerHTML = '';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 240 240');
        svg.setAttribute('role', 'presentation');
        svg.classList.add('gallery-svg-preview');
        draw(svg);
        container.appendChild(svg);
      },
      createContent(node) {
        draw(node);
      }
    };
  })(),
  (() => {
    function draw(target) {
      const shield = document.createElementNS(svgNS, 'path');
      shield.setAttribute('d', 'M120 20 C160 40 200 60 200 110 C200 170 160 210 120 220 C80 210 40 170 40 110 C40 60 80 40 120 20');
      shield.setAttribute('fill', '#1f2430');
      shield.setAttribute('stroke', '#7c5cff');
      shield.setAttribute('stroke-width', '8');

      const star = document.createElementNS(svgNS, 'polygon');
      star.setAttribute('points', '120,60 136,100 180,100 144,126 160,170 120,146 80,170 96,126 60,100 104,100');
      star.setAttribute('fill', '#ffce6b');
      star.setAttribute('filter', 'url(#selection-shadow)');

      const orbit = document.createElementNS(svgNS, 'path');
      orbit.setAttribute('d', 'M70 150 C100 120 140 170 170 140');
      orbit.setAttribute('stroke', '#7c5cff');
      orbit.setAttribute('stroke-width', '8');
      orbit.setAttribute('stroke-linecap', 'round');
      orbit.setAttribute('fill', 'none');

      target.append(shield, star, orbit);
    }

    return {
      type: 'Design',
      key: 'starShield',
      name: 'Star Shield',
      tags: ['badge', 'space', 'hero'],
      width: 240,
      height: 240,
      baseColor: '#7c5cff',
      renderPreview(container) {
        if (!container) return;
        container.innerHTML = '';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 240 240');
        svg.setAttribute('role', 'presentation');
        svg.classList.add('gallery-svg-preview');
        draw(svg);
        container.appendChild(svg);
      },
      createContent(node) {
        draw(node);
      }
    };
  })(),
  (() => {
    function draw(target) {
      const sun = document.createElementNS(svgNS, 'circle');
      sun.setAttribute('cx', '120');
      sun.setAttribute('cy', '60');
      sun.setAttribute('r', '36');
      sun.setAttribute('fill', '#ffe6a7');
      sun.setAttribute('opacity', '0.85');

      target.appendChild(sun);

      const stripes = ['#ff9a8b', '#ff6a88', '#ff99ac', '#fad0c4'];
      stripes.forEach((color, index) => {
        const stripe = document.createElementNS(svgNS, 'rect');
        stripe.setAttribute('x', '20');
        stripe.setAttribute('y', `${60 + index * 28}`);
        stripe.setAttribute('width', '200');
        stripe.setAttribute('height', '24');
        stripe.setAttribute('rx', '12');
        stripe.setAttribute('fill', color);
        stripe.setAttribute('opacity', `${0.9 - index * 0.15}`);
        target.appendChild(stripe);
      });

      const horizon = document.createElementNS(svgNS, 'rect');
      horizon.setAttribute('x', '20');
      horizon.setAttribute('y', '172');
      horizon.setAttribute('width', '200');
      horizon.setAttribute('height', '18');
      horizon.setAttribute('rx', '9');
      horizon.setAttribute('fill', '#ff9a8b');

      target.appendChild(horizon);
    }

    return {
      type: 'Design',
      key: 'sunsetStripes',
      name: 'Sunset Stripes',
      tags: ['retro', 'sunset', 'warm'],
      width: 240,
      height: 220,
      baseColor: '#ff9a8b',
      renderPreview(container) {
        if (!container) return;
        container.innerHTML = '';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 240 220');
        svg.setAttribute('role', 'presentation');
        svg.classList.add('gallery-svg-preview');
        draw(svg);
        container.appendChild(svg);
      },
      createContent(node) {
        draw(node);
      }
    };
  })(),
  (() => {
    function draw(target) {
      const board = document.createElementNS(svgNS, 'rect');
      board.setAttribute('x', '40');
      board.setAttribute('y', '40');
      board.setAttribute('width', '160');
      board.setAttribute('height', '160');
      board.setAttribute('rx', '24');
      board.setAttribute('fill', '#1f2933');

      const grid = document.createElementNS(svgNS, 'path');
      grid.setAttribute('d', 'M60 100 H220 M60 140 H220 M100 60 V220 M140 60 V220');
      grid.setAttribute('stroke', '#4ed4ff');
      grid.setAttribute('stroke-width', '6');
      grid.setAttribute('stroke-linecap', 'round');

      const glow = document.createElementNS(svgNS, 'rect');
      glow.setAttribute('x', '80');
      glow.setAttribute('y', '80');
      glow.setAttribute('width', '80');
      glow.setAttribute('height', '80');
      glow.setAttribute('rx', '16');
      glow.setAttribute('fill', '#4ed4ff');
      glow.setAttribute('opacity', '0.2');

      target.append(board, grid, glow);
    }

    return {
      type: 'Design',
      key: 'neonGrid',
      name: 'Neon Grid',
      tags: ['tech', 'grid', 'futuristic'],
      width: 240,
      height: 240,
      baseColor: '#4ed4ff',
      renderPreview(container) {
        if (!container) return;
        container.innerHTML = '';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 240 240');
        svg.setAttribute('role', 'presentation');
        svg.classList.add('gallery-svg-preview');
        draw(svg);
        container.appendChild(svg);
      },
      createContent(node) {
        draw(node);
      }
    };
  })(),
  (() => {
    function draw(target) {
      const colors = ['#ffc6ff', '#ff9de6', '#ff5d8f'];
      colors.forEach((color, index) => {
        const triangle = document.createElementNS(svgNS, 'polygon');
        triangle.setAttribute('points', `120,${40 + index * 50} ${60 - index * 10},${200} ${180 + index * 10},${200}`);
        triangle.setAttribute('fill', color);
        triangle.setAttribute('opacity', `${0.85 - index * 0.2}`);
        target.appendChild(triangle);
      });

      const outline = document.createElementNS(svgNS, 'polygon');
      outline.setAttribute('points', '120,40 60,200 180,200');
      outline.setAttribute('fill', 'none');
      outline.setAttribute('stroke', '#5f0a87');
      outline.setAttribute('stroke-width', '6');
      outline.setAttribute('stroke-linejoin', 'round');
      target.appendChild(outline);
    }

    return {
      type: 'Design',
      key: 'triangleStack',
      name: 'Triangle Stack',
      tags: ['geometric', 'stacked', 'bold'],
      width: 240,
      height: 220,
      baseColor: '#ff5d8f',
      renderPreview(container) {
        if (!container) return;
        container.innerHTML = '';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 240 220');
        svg.setAttribute('role', 'presentation');
        svg.classList.add('gallery-svg-preview');
        draw(svg);
        container.appendChild(svg);
      },
      createContent(node) {
        draw(node);
      }
    };
  })()
];
