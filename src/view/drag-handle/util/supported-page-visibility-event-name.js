// @flow
export default (() => {
  const base: string = 'visibilitychange';
  // Server side rendering
  if (typeof document === 'undefined') {
    return base;
  }

  const candidates: string[] = [
    base,
    `ms${base}`,
    `webkit${base}`,
    `moz${base}`,
    `o${base}`,
  ];

  const supported: ?string = candidates.find((eventName: string): boolean =>
    `on${eventName}` in document
  );

  return supported || base;
})();
