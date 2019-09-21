declare function raf(callback: (timestamp: number) => void): AnimationFrameID;

// TODO: would like to use `import type {Stub} from 'raf-stub'
// This is not supported right now: https://github.com/flow-typed/flow-typed/issues/2023
declare var requestAnimationFrame: {
  add: (cb: Function) => number,
  remove: (id: number) => void,
  flush: (duration?: number) => void,
  reset: () => void,
  step: (steps?: number, duration?: number) => void,
} & typeof raf;
