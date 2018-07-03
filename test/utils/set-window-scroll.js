// @flow
import { type Position } from 'css-box-model';

type Options = {|
  shouldPublish: boolean,
|};

const defaultOptions: Options = {
  shouldPublish: true,
};

const setWindowScroll = (
  point: Position,
  options?: Options = defaultOptions,
) => {
  window.pageXOffset = point.x;
  window.pageYOffset = point.y;

  if (options.shouldPublish) {
    window.dispatchEvent(new Event('scroll'));
  }
};

const original: Position = {
  x: window.pageXOffset,
  y: window.pageYOffset,
};

export const resetWindowScroll = () => setWindowScroll(original);

export default setWindowScroll;
