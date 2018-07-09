// // @flow

// it('should abort a pending drag', () => {

// });

// it('should cancel an existing drag', () => {

// });

// it('should stop publishing events', () => {

// });

// it('should allow new drags to start', () => {

// });

// it('should cancel any pending window scroll movements', () => {
//   // lift
//   mouseDown(wrapper);
//   windowMouseMove({ x: 0, y: sloppyClickThreshold });

//   expect(callbacksCalled(callbacks)({ onLift: 1 })).toBe(true);

//   // scroll is queued
//   dispatchWindowEvent('scroll');
//   expect(callbacks.onWindowScroll).not.toHaveBeenCalled();

//   // disable drag handle
//   wrapper.setProps({ isEnabled: false });

//   // flushing the animation would normally trigger a window scroll movement
//   requestAnimationFrame.flush();
//   expect(callbacks.onWindowScroll).not.toHaveBeenCalled();
//   expect(callbacks.onCancel).toHaveBeenCalled();
// });

// it('should cancel an existing drag', () => {
//   // lift
//   mouseDown(wrapper);
//   windowMouseMove({ x: 0, y: sloppyClickThreshold });
//   // move
//   windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
//   requestAnimationFrame.step();

//   expect(
//     callbacksCalled(callbacks)({
//       onLift: 1,
//       onMove: 1,
//       onCancel: 0,
//     }),
//   ).toBe(true);

//   wrapper.setProps({ isEnabled: false });
//   expect(
//     callbacksCalled(callbacks)({
//       onLift: 1,
//       onMove: 1,
//       onCancel: 1,
//     }),
//   ).toBe(true);
// });

// it('should stop listening to mouse events', () => {
//   // lift
//   mouseDown(wrapper);
//   windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
//   // move
//   windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
//   requestAnimationFrame.step();

//   wrapper.setProps({ isEnabled: false });
//   expect(
//     callbacksCalled(callbacks)({
//       onLift: 1,
//       onMove: 1,
//       onCancel: 1,
//     }),
//   ).toBe(true);

//   // should have no impact
//   windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
//   requestAnimationFrame.step();
//   windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });
//   requestAnimationFrame.step();
//   windowMouseUp();
//   windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });
//   requestAnimationFrame.step();

//   // being super safe
//   requestAnimationFrame.flush();

//   expect(
//     callbacksCalled(callbacks)({
//       onLift: 1,
//       onMove: 1,
//       onCancel: 1,
//     }),
//   ).toBe(true);
// });
