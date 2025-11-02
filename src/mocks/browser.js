import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// This sets up the service worker to intercept network requests, check it!
export const worker = setupWorker(...handlers);
