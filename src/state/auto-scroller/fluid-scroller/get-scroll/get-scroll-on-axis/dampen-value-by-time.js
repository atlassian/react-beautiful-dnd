// @flow
import getPercentage from '../../get-percentage';
import config from '../../config';

const startPhase2FromPercentage: number =
  config.durationDampening.accelerateFromPercentage;

export default (proposedScroll: number, dragStartTime: number): number => {
  const startOfRange: number = dragStartTime;
  const endOfRange: number = dragStartTime + config.durationDampening.duration;
  const current: number = Date.now();

  const percentageThroughDampeningPeriod: number = getPercentage({
    startOfRange,
    endOfRange,
    current,
  });

  // no dampening required
  if (
    percentageThroughDampeningPeriod <= 0 ||
    percentageThroughDampeningPeriod >= 1
  ) {
    return proposedScroll;
  }

  // phase 1: up to 30% we delegate to the min scroll speed
  if (percentageThroughDampeningPeriod < startPhase2FromPercentage) {
    return 0;
  }

  const percentageThroughPhase2: number = getPercentage({
    startOfRange: startPhase2FromPercentage,
    endOfRange: 1,
    current: percentageThroughDampeningPeriod,
  });

  const scroll: number = proposedScroll * config.ease(percentageThroughPhase2);

  return Math.ceil(scroll);
};
