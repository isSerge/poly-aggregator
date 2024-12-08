import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { main } from '../index.js';
import { setupTest } from './utils/test-utils.js';

describe('Main application', () => {
  setupTest();

  it('should run without throwing', () => {
    assert.doesNotThrow(main);
  });
});
