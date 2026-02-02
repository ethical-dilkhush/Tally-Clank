/**
 * Stub for pino-pretty (optional pino dependency).
 * Used by WalletConnect/pino in web builds; avoids "Can't resolve 'pino-pretty'" on Vercel.
 */
function noop() {}
const stub = function pinoPrettyStub() {
  return { write: noop, end: noop, flush: noop };
};
stub.default = stub;
module.exports = stub;
