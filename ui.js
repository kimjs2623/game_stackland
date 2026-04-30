import { renderAll } from './ui-render.js';
import { registerUiEvents } from './ui-events.js';
import { registerUiModals } from './ui-modals.js';

registerUiModals();
registerUiEvents();

export { renderAll };