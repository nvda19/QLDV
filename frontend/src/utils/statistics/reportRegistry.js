import mau6TKCT from './templates/mau6TKCT';
import customReport from './templates/customReport';

const TEMPLATES = [
  mau6TKCT,
  customReport,
];

export function getTemplates() {
  return TEMPLATES;
}

export function getTemplateById(id) {
  return TEMPLATES.find((t) => t.id === id);
}

export function getDefaultTemplate() {
  return TEMPLATES[0];
}
