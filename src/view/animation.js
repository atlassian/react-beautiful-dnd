// @flow
import type { SpringHelperConfig } from 'react-motion/lib/Types';

export const physics = (() => {
  const base = {
    stiffness: 1000, // fast
    // stiffness: 100, // slow (for debugging)
    damping: 60,
    // precision: 0.5,
    precision: 0.99,
  };

  const standard: SpringHelperConfig = {
    ...base,
  };

  const fast: SpringHelperConfig = {
    ...base,
    stiffness: base.stiffness * 2,
  };

  return { standard, fast };
})();

const isDropping = (distance: Position): string => {
  // 0px = 0.33s
  // >= 1500px = 0.55s
  const time: number = 0.33;
  return `transform ${time}s cubic-bezier(.2,1,.1,1)`;
};

export const css = {
  outOfTheWay: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
  // TODO: dynamic time
  isDropping: `transform 0.33s cubic-bezier(.2,1,.1,1)`,
};
