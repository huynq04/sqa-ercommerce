import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for environments that don't provide them (jsdom/node)
if (typeof (global as any).TextEncoder === 'undefined') {
  (global as any).TextEncoder = TextEncoder;
}
if (typeof (global as any).TextDecoder === 'undefined') {
  (global as any).TextDecoder = TextDecoder;
}
