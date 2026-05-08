import ws from 'ws';

// Node 20 lacks native WebSocket — polyfill for Supabase realtime
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = ws;
}
