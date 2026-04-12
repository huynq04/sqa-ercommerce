import { describe, expect, it } from '@jest/globals';

import { AppService } from './app.service';

describe('AppService', () => {
  it('returns hello message', () => {
    const service = new AppService();

    expect(service.getHello()).toBe('Hello World!');
  });
});
