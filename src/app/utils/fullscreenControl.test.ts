import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isDocumentFullscreen,
  toggleDocumentFullscreen,
  type FullscreenDocumentLike,
  type FullscreenElementLike,
} from './fullscreenControl';

test('toggleDocumentFullscreen enters and exits fullscreen via native Fullscreen API', async () => {
  let activeEl: Element | null = null;
  const dataset: Record<string, string | undefined> = {};

  const docEl: FullscreenElementLike = {
    dataset: dataset as unknown as DOMStringMap,
    requestFullscreen: async () => {
      activeEl = docEl as unknown as Element;
    },
  };

  const mockDoc: FullscreenDocumentLike = {
    get fullscreenElement() {
      return activeEl;
    },
    documentElement: docEl,
    exitFullscreen: async () => {
      activeEl = null;
    },
  };

  assert.equal(isDocumentFullscreen(mockDoc), false);

  const entered = await toggleDocumentFullscreen(docEl, mockDoc);
  assert.equal(entered, true);
  assert.equal(isDocumentFullscreen(mockDoc), true);
  assert.equal(dataset.fullscreen, 'true');

  const exited = await toggleDocumentFullscreen(docEl, mockDoc);
  assert.equal(exited, false);
  assert.equal(isDocumentFullscreen(mockDoc), false);
  assert.equal(dataset.fullscreen, 'false');
});

test('toggleDocumentFullscreen falls back cleanly when browser/iframe rejects requestFullscreen', async () => {
  const dataset: Record<string, string | undefined> = {};

  const docEl: FullscreenElementLike = {
    dataset: dataset as unknown as DOMStringMap,
    requestFullscreen: async () => {
      throw new Error('Permissions check failed');
    },
  };

  const mockDoc: FullscreenDocumentLike = {
    fullscreenElement: null,
    documentElement: docEl,
  };

  const entered = await toggleDocumentFullscreen(docEl, mockDoc);
  assert.equal(entered, true);
  assert.equal(isDocumentFullscreen(mockDoc), true);
  assert.equal(dataset.fullscreen, 'true');

  const exited = await toggleDocumentFullscreen(docEl, mockDoc);
  assert.equal(exited, false);
  assert.equal(isDocumentFullscreen(mockDoc), false);
  assert.equal(dataset.fullscreen, 'false');
});
