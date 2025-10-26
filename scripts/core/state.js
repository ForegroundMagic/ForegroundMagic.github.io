import { printableArea } from './constants.js';

export function createId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const counters = {
  Design: 0,
  Element: 0,
  Text: 0
};

export const state = {
  layers: [],
  activeLayerId: null,
  activeTemplate: null,
  galleryType: null,
  interaction: null,
  needsRender: false
};

let galleryState = null;

export function getGalleryState() {
  return galleryState;
}

export function setGalleryState(nextState) {
  galleryState = nextState;
}

export const center = {
  x: printableArea.width / 2,
  y: printableArea.height / 2
};
