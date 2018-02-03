// @flow
import type { Position } from '../../src/types';

type Options = {|
  shouldPublish: boolean,
|};

const defaultOptions: Options = {
  shouldPublish: true,
};

export default (point: Position, options?: Options = defaultOptions) => {
  window.pageXOffset = point.x;
  window.pageYOffset = point.y;

  if (options.shouldPublish) {
    window.dispatchEvent(new Event('scroll'));
  }
};
