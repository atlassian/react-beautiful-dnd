// @flow

// Values used to control how the fluid auto scroll feels
const config = {
  // percentage distance from edge of container:
  startFrom: 0.25,
  maxSpeedAt: 0.05,
  // pixels per frame
  maxScrollSpeed: 28,
  // ms: how long to dampen the speed of an auto scroll from the start of a drag
  dampenForDuration: 1200,
  // A function used to ease the distance been the startFrom and maxSpeedAt values
  // A simple linear function would be: (percentage) => percentage;
  // percentage is between 0 and 1
  // result must be between 0 and 1
  ease: (percentage: number) => Math.pow(percentage, 2),

  dampeningEase: (percentage: number) => {
    const breakpoint = 0.3;
    // super slow up to 30%
    if (percentage < breakpoint) {
      return percentage / 10;
    }
    const value = Math.pow((percentage - breakpoint) / (1 - breakpoint), 3);
    return value * 0.97 + 0.03;
  },
};

export default config;
