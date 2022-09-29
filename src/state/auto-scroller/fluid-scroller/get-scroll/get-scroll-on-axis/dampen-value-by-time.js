// @flow
import getPercentage from '../../get-percentage';
import config from '../../config';
import minScroll from './min-scroll';
import { type FluidScrollerOptions } from '../../../../../types';

const defaultAccelerateAt: number = config.durationDampening.accelerateAt;
const defaultStopAt: number = config.durationDampening.stopDampeningAt;

export default (
  proposedScroll: number,
  dragStartTime: number,
  fluidScrollerOptions?: FluidScrollerOptions,
): number => {
  const accelerateAt: number =
    fluidScrollerOptions?.configOverride?.durationDampening?.accelerateAt ||
    defaultAccelerateAt;
  const stopAt: number =
    fluidScrollerOptions?.configOverride?.durationDampening?.stopDampeningAt ||
    defaultStopAt;
  const ease: Function =
    fluidScrollerOptions?.configOverride?.ease || config.ease;

  const startOfRange: number = dragStartTime;
  const endOfRange: number = stopAt;
  const now: number = Date.now();
  const runTime: number = now - startOfRange;

  // we have finished the time dampening period
  if (runTime >= stopAt) {
    return proposedScroll;
  }

  // Up to this point we know there is a proposed scroll
  // but we have not reached our accelerate point
  // Return the minimum amount of scroll
  if (runTime < accelerateAt) {
    return minScroll;
  }

  const betweenAccelerateAtAndStopAtPercentage: number = getPercentage({
    startOfRange: accelerateAt,
    endOfRange,
    current: runTime,
  });

  const scroll: number =
    proposedScroll * ease(betweenAccelerateAtAndStopAtPercentage);

  return Math.ceil(scroll);
};
