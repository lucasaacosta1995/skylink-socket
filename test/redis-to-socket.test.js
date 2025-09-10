import test from 'node:test';
import assert from 'node:assert/strict';

// Requiere server.js corriendo aparte para un test real.
// Aquí validamos estructura esperada del mensaje.

test('reservation.updated payload shape', () => {
  const payload = {
    event: 'reservation.updated',
    data: { id: 'abc123', status: 'CONFIRMED', passengers: [] }
  };
  // shape check
  assert.equal(typeof payload.event, 'string');
  assert.equal(typeof payload.data.id, 'string');
  assert.ok(['CONFIRMED','CANCELLED','CHECKED_IN','PENDING'].includes(payload.data.status));
});
