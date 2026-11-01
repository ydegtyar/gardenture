import test from 'node:test';
import assert from 'node:assert/strict';
import { InputManager } from './InputManager';

test('single touch floating joystick controls hero movement vector', () => {
  const input = new InputManager();
  input.handlePointerDown({ pointerId: 1, clientX: 200, clientY: 400, pointerType: 'touch' }, 100);
  input.handlePointerMove({ pointerId: 1, clientX: 256, clientY: 400, pointerType: 'touch' }, 180);

  const vec = input.getMoveVector();
  assert.ok(vec.x > 0.95, `expected vec.x > 0.95, got ${vec.x}`);
  assert.equal(Math.round(vec.y * 100), 0);
  assert.equal(input.getJoystickVisualState().active, true);
  assert.equal(input.getActivePointerId(), 1);
});

test('multi-touch: second touch swipe triggers dash while primary touch continues moving hero uninterrupted', () => {
  const input = new InputManager();
  const dashAngles: (number | undefined)[] = [];
  input.setCallbacks({
    onDash: (angle) => dashAngles.push(angle),
    onKeyShortcut: () => {},
  });

  // 1. Primary finger (pointerId: 1) holds & moves hero slowly to the left
  input.handlePointerDown({ pointerId: 1, clientX: 200, clientY: 500, pointerType: 'touch' }, 100);
  input.handlePointerMove({ pointerId: 1, clientX: 185, clientY: 500, pointerType: 'touch' }, 250);
  input.handlePointerMove({ pointerId: 1, clientX: 140, clientY: 500, pointerType: 'touch' }, 500);

  const moveBefore = input.getMoveVector();
  assert.ok(moveBefore.x < -0.9, `expected primary touch moving left, got ${moveBefore.x}`);
  assert.equal(dashAngles.length, 0);

  // 2. Second finger (pointerId: 2) touches down on the right side and swipes UP-RIGHT
  input.handlePointerDown({ pointerId: 2, clientX: 800, clientY: 500, pointerType: 'touch' }, 520);
  assert.equal(input.getSecondaryPointerCount(), 1);
  assert.equal(input.getActivePointerId(), 1);

  input.handlePointerMove({ pointerId: 2, clientX: 860, clientY: 440, pointerType: 'touch' }, 555);

  assert.equal(dashAngles.length, 1, 'expected secondary swipe to trigger dash');
  const expectedAngle = Math.atan2(-60, 60); // -PI / 4 (up-right)
  assert.ok(
    Math.abs((dashAngles[0] ?? 0) - expectedAngle) < 0.01,
    `expected dash angle ${expectedAngle}, got ${dashAngles[0]}`
  );

  // 3. Primary finger movement must still be active and moving left
  const moveDuring = input.getMoveVector();
  assert.ok(
    moveDuring.x < -0.9,
    `expected primary movement to remain uninterrupted during secondary swipe, got ${moveDuring.x}`
  );
  assert.equal(input.getJoystickVisualState().active, true);

  // 4. Lifting second finger cleans up secondary track without canceling primary finger
  input.handlePointerUpOrCancel(
    { pointerId: 2, clientX: 860, clientY: 440, pointerType: 'touch', type: 'pointerup' },
    570
  );
  assert.equal(input.getSecondaryPointerCount(), 0);
  assert.equal(input.getActivePointerId(), 1);
  const moveAfterSecondLift = input.getMoveVector();
  assert.ok(
    moveAfterSecondLift.x < -0.9,
    `expected primary movement to stay active after lifting second finger, got ${moveAfterSecondLift.x}`
  );

  // 5. Primary finger can continue adjusting movement direction
  input.handlePointerMove({ pointerId: 1, clientX: 200, clientY: 560, pointerType: 'touch' }, 650);
  const moveDown = input.getMoveVector();
  assert.ok(moveDown.y > 0.8, `expected primary finger to steer down, got ${moveDown.y}`);
});

test('multi-touch: moderate secondary swipe triggers dash on pointerup while hero is moving', () => {
  const input = new InputManager();
  const dashAngles: (number | undefined)[] = [];
  input.setCallbacks({
    onDash: (angle) => dashAngles.push(angle),
    onKeyShortcut: () => {},
  });

  // Primary finger holds movement right
  input.handlePointerDown({ pointerId: 10, clientX: 150, clientY: 400, pointerType: 'touch' }, 100);
  input.handlePointerMove({ pointerId: 10, clientX: 170, clientY: 400, pointerType: 'touch' }, 300);
  input.handlePointerMove({ pointerId: 10, clientX: 210, clientY: 400, pointerType: 'touch' }, 600);

  // Secondary finger does a short release swipe downward
  input.handlePointerDown({ pointerId: 11, clientX: 700, clientY: 300, pointerType: 'touch' }, 610);
  input.handlePointerUpOrCancel(
    { pointerId: 11, clientX: 700, clientY: 340, pointerType: 'touch', type: 'pointerup' },
    780
  );

  assert.equal(dashAngles.length, 1);
  assert.ok(Math.abs((dashAngles[0] ?? 0) - Math.PI / 2) < 0.01);
  assert.ok(input.getMoveVector().x > 0.9);
});

test('multi-touch: tapping item slot with second touch activates power-up without interrupting primary hero movement', () => {
  const input = new InputManager();
  const usedSlots: number[] = [];
  input.setCallbacks({
    onDash: () => {},
    onKeyShortcut: () => {},
    onUsePowerUp: (slotIdx) => usedSlots.push(slotIdx),
  });

  // Primary finger holds movement up
  input.handlePointerDown({ pointerId: 1, clientX: 200, clientY: 500, pointerType: 'touch' }, 100);
  input.handlePointerMove({ pointerId: 1, clientX: 200, clientY: 480, pointerType: 'touch' }, 250);
  input.handlePointerMove({ pointerId: 1, clientX: 200, clientY: 430, pointerType: 'touch' }, 500);

  assert.ok(input.getMoveVector().y < -0.9);

  // Simulate document.elementFromPoint hitting HUD power-up slot 0 when second finger taps it
  const prevDoc = (globalThis as Record<string, unknown>).document;
  const mockSlotButton = {
    disabled: false,
    getAttribute: (name: string) => (name === 'data-powerup-slot' ? '0' : null),
    closest: (selector: string) =>
      selector.includes('[data-powerup-slot]') ? mockSlotButton : null,
  };
  (globalThis as Record<string, unknown>).document = {
    elementFromPoint: (x: number, y: number) =>
      x === 1280 && y === 820 ? mockSlotButton : null,
  };

  try {
    input.handlePointerDown(
      { pointerId: 2, clientX: 1280, clientY: 820, pointerType: 'touch' },
      540
    );
    assert.deepEqual(usedSlots, [0]);
    assert.equal(input.getActivePointerId(), 1);
    assert.equal(input.getSecondaryPointerCount(), 0);
    assert.ok(
      input.getMoveVector().y < -0.9,
      'primary hero movement must remain active after tapping item with second finger'
    );
  } finally {
    (globalThis as Record<string, unknown>).document = prevDoc;
  }
});
