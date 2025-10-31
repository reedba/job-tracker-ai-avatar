import { createConsumer } from '@rails/actioncable';

// Get the WebSocket URL from environment or default
const CABLE_URL = import.meta.env.VITE_CABLE_URL || 'ws://localhost:3000/cable';

let consumer = null;

export const getConsumer = () => {
  if (!consumer) {
    const token = localStorage.getItem('token');
    consumer = createConsumer(`${CABLE_URL}?token=${token}`);
  }
  return consumer;
};

export const disconnectConsumer = () => {
  if (consumer) {
    consumer.disconnect();
    consumer = null;
  }
};

export default { getConsumer, disconnectConsumer };
