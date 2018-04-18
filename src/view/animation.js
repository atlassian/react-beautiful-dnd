// @flow
export const physics = (() => {
  const base = {
    tension: 1000, // fast
    // tension: 100, // slow
    friction: 60,
    restSpeedThreshold: 0.9999,
    restDisplacementThreshold: 0.9999,
  };

  const standard = {
    ...base,
  };

  const fast = {
    ...base,
    stiffness: base.tension * 2,
  };

  return { standard, fast };
})();

export const css = {
  outOfTheWay: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
};

