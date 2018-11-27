// @flow
import getEasedPercentage from './get-eased-percentage';
import config from '../../config';

export default (proposedSpeed: number, dragStartTime: number): number => {
  const startOfRange: number = dragStartTime;
  const endOfRange: number = dragStartTime + config.dampenForDuration;
  const current: number = Date.now();

  const percentage: number = getEasedPercentage(
    startOfRange,
    endOfRange,
    current,
  );

  if (percentage >= 1) {
    return proposedSpeed;
  }

  const speed: number = proposedSpeed * percentage;

  return speed;
};
