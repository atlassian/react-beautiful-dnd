// @flow
import type { SpringHelperConfig } from 'react-motion/lib/Types';

export const physics = (() => {
  const base = {
    stiffness: 1000, // fast
    // stiffness: 200, // medium
    // stiffness: 100, // slow
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

export const css = {
  outOfTheWay: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
};

