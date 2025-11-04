import { createConsumer } from '@rails/actioncable';

// Get the WebSocket URL from environment or default
const CABLE_URL = import.meta.env.VITE_CABLE_URL || 'ws://localhost:3000/cable';

let consumer = null;
let consumerToken = null;

// Returns an ActionCable consumer. If `overrideToken` is provided, we create a
// new consumer that passes that token as a query param. If not, we use the
// token stored in localStorage (authenticated user). This keeps the consumer
// in-memory for guest session tokens instead of persisting them.
export const getConsumer = (overrideToken = null) => {
  const tokenToUse = overrideToken || localStorage.getItem('token');

  // If a consumer already exists and token hasn't changed, return it
  if (consumer && consumerToken === tokenToUse) return consumer;

  // Otherwise disconnect existing consumer (if any) and create a new one
  if (consumer) {
    try { consumer.disconnect(); } catch (e) { console.warn('disconnect failed', e); }
    consumer = null;
  }

  consumerToken = tokenToUse;
  // Only append the token query param when we actually have a token. This
  // prevents creating a consumer with `?token=null` which can be rejected by
  // the server. If there's no token we create a plain consumer (but the
  // caller should avoid creating consumers when unauthenticated).
  if (consumerToken) {
    consumer = createConsumer(`${CABLE_URL}?token=${consumerToken}`);
  } else {
    consumer = createConsumer(CABLE_URL);
  }
  return consumer;
};

export const disconnectConsumer = () => {
  if (consumer) {
    try { consumer.disconnect(); } catch (e) { console.warn('disconnect failed', e); }
    consumer = null;
    consumerToken = null;
  }
};

export default { getConsumer, disconnectConsumer };
