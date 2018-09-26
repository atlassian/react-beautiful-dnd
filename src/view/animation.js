// @flow
import type { Position } from 'css-box-model';
import { isEqual, origin } from '../state/position';

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

const outOfTheWayTime: number = 0.2;
const outOfTheWayTiming = `${outOfTheWayTime}s ${curves.outOfTheWay}`;

export const transitions = {
  fluid: `opacity ${outOfTheWayTiming}`,
  jump: `transform ${outOfTheWayTiming}, opacity ${outOfTheWayTiming}`,
  drop: (duration: number): string => {
    const timing: string = `${duration}s ${curves.drop}`;
    return `transform ${timing}, opacity ${timing}`;
  },
  outOfTheWay: `transform ${outOfTheWayTiming}`,
};

const moveTo = (offset: Position): ?string =>
  isEqual(offset, origin) ? null : `translate(${offset.x}px, ${offset.y}px)`;

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
