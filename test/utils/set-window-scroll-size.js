// @flow

type Args = {|
  scrollHeight: number,
  scrollWidth: number,
|};

const setWindowScrollSize = ({ scrollHeight, scrollWidth }: Args): void => {
  const el: ?HTMLElement = document.documentElement;

  if (!el) {
    throw new Error('Unable to find document element');
  }

  el.scrollHeight = scrollHeight;
  el.scrollWidth = scrollWidth;
};

const original: Args = (() => {
  const el: ?HTMLElement = document.documentElement;

  if (!el) {
    throw new Error('Unable to find document element');
  }

  return {
    scrollWidth: el.scrollWidth,
    scrollHeight: el.scrollHeight,
  };
})();

export const resetWindowScrollSize = () => setWindowScrollSize(original);

export default setWindowScrollSize;
