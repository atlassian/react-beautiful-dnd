// @flow
import getPercentage from '../../get-percentage';
import config from '../../config';

const startPhase2From: number = config.durationDampening.accelerateFrom;

export default (proposedSpeed: number, dragStartTime: number): number => {
  const startOfRange: number = dragStartTime;
  const endOfRange: number = dragStartTime + config.durationDampening.duration;
  const current: number = Date.now();

  const percentageThroughDampeningPeriod: number = getPercentage({
    startOfRange,
    endOfRange,
    current,
  });

  // no dampening required
  if (percentageThroughDampeningPeriod >= 1) {
    return proposedSpeed;
  }

  // phase 1: up to 30% we delegate to the min scroll speed
  if (percentageThroughDampeningPeriod < startPhase2From) {
    return 0;
  }

  const percentageThroughPhase2: number = config.ease(
    getPercentage({
      startOfRange: startPhase2From,
      endOfRange: 1,
      current: percentageThroughDampeningPeriod,
    }),
  );

  return proposedSpeed * percentageThroughPhase2;
};
