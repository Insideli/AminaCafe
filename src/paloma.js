// Совместимый вход для старых импортов. Новая логика находится в api/ и services/.
export {
  buildPalomaOrder,
  fetchPalomaMenu,
  fetchPalomaOrderStatus,
  fetchPalomaPoints,
  fetchPalomaStoplist,
  sendOrderToPaloma,
  submitOrderToPaloma,
  syncPalomaCatalog,
  testPalomaConnection,
} from './services/palomaService.js';
export { PalomaApiError } from './api/palomaClient.js';
