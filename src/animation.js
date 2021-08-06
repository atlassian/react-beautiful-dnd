// @flow
import type { Position } from 'css-box-model';
import { isEqual, origin } from './state/position';

export const curves = {
  outOfTheWay: 'cubic-bezier(0.2, 0, 0, 1)',
  drop: 'cubic-bezier(.2,1,.1,1)',
};

export const combine = {
  opacity: {
    // while dropping: fade out totally
    drop: 0,
    // while dragging: fade out partially
    combining: 0.7,
  },
  scale: {
    drop: 0.75,
  },
};

export const timings = {
  outOfTheWay: 0.2,
  // greater than the out of the way time
  // so that when the drop ends everything will
  // have to be out of the way
  minDropTime: 0.33,
  maxDropTime: 0.55,
};

// slow timings
// uncomment to use
// export const timings = {
//   outOfTheWay: 2,
//   // greater than the out of the way time
//   // so that when the drop ends everything will
//   // have to be out of the way
//   minDropTime: 3,
//   maxDropTime: 4,
// };

const outOfTheWayTiming: string = `${timings.outOfTheWay}s ${curves.outOfTheWay}`;
export const placeholderTransitionDelayTime: number = 0.1;

export const transitions = {
  fluid: `opacity ${outOfTheWayTiming}`,
  snap: `transform ${outOfTheWayTiming}, opacity ${outOfTheWayTiming}`,
  drop: (duration: number): string => {
    const timing: string = `${duration}s ${curves.drop}`;
    return `transform ${timing}, opacity ${timing}`;
  },
  outOfTheWay: `transform ${outOfTheWayTiming}`,
  placeholder: `height ${outOfTheWayTiming}, width ${outOfTheWayTiming}, margin ${outOfTheWayTiming}`,
};

const clamp = (value: number, min: number, max: number) => {
  if (value >= max) {
    return max;
  }
  if (value <= min) {
    return min;
  }
  return value;
};

const moveTo = (
  offset: Position,
  lockedAxis?: DraggableLockedAxis,
): ?string => {
  if (isEqual(offset, origin)) {
    return null;
  }
  if (!lockedAxis) {
    return `translate(${offset.x}px, ${offset.y}px)`;
  }
  if (
    !lockedAxis.allowedDeviation ||
    lockedAxis.allowedDeviation === 0
  ) {
    // Locked rigidly to an axis
    if (lockedAxis.axis === 'x') {
      return `translate(0px, ${offset.y}px)`;
    }
    return `translate(${offset.x}px, 0px)`;
  } else {
    // Locked loosely to an axis
    if (lockedAxis.axis === 'x') {
      return `translate(${clamp(
        offset.x,
        -lockedAxis.allowedDeviation,
        lockedAxis.allowedDeviation,
      )}px, ${offset.y}px)`;
    }
    return `translate(${offset.x}px, ${clamp(
      offset.y,
      -lockedAxis.allowedDeviation,
      lockedAxis.allowedDeviation,
    )}px)`;
  }
};

export const transforms = {
  moveTo,
  drop: (offset: Position, isCombining: boolean) => {
    const translate: ?string = moveTo(offset);
    if (!translate) {
      return null;
    }

    // only transforming the translate
    if (!isCombining) {
      return translate;
    }

    // when dropping while combining we also update the scale
    return `${translate} scale(${combine.scale.drop})`;
  },
};
