// @flow

// Values used to control how the fluid auto scroll feels
const config = {
  // percentage distance from edge of container:
  startFrom: 0.25,
  maxSpeedAt: 0.05,
  // pixels per frame
  maxScrollSpeed: 28,

  // A function used to ease the distance been the startFrom and maxSpeedAt values
  // A simple linear function would be: (percentage) => percentage;
  // percentage is between 0 and 1
  // result must be between 0 and 1
  ease: (percentage: number): number => Math.pow(percentage, 2),

  durationDampening: {
    // ms: how long to dampen the speed of an auto scroll from the start of a drag
    duration: 1200,
    // % to start accelerating the reduction of duration dampening
    accelerateFrom: 0.3,
  },
};

export default config;
