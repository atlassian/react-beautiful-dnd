declare function raf(callback: (timestamp: number) => void): AnimationFrameID;

declare var requestAnimationFrame: {
  step: () => void,
  flush: () => void,
} & typeof raf;
