declare function raf(callback: (timestamp: number) => void): AnimationFrameID;

declare var requestAnimationFrame: {
  // TODO: export type Stub from raf-stub
  add: (cb: Function) => number,
  remove: (id: number) => void,
  flush: (duration?: number) => void,
  reset: () => void,
  step: (steps?: number, duration?: number) => void
} & typeof raf;
