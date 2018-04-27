// @flow
import { type Position } from 'css-box-model';
import { subtract } from './position';

type Args = {|
  scrollHeight: number,
  scrollWidth: number,
  height: number,
  width: number,
|}
export default ({
  scrollHeight,
  scrollWidth,
  height,
  width,
}: Args): Position => {
  const maxScroll: Position = subtract(
    // full size
    { x: scrollWidth, y: scrollHeight },
    // viewport size
    { x: width, y: height }
  );

  const adjustedMaxScroll: Position = {
    x: Math.max(0, maxScroll.x),
    y: Math.max(0, maxScroll.y),
  };

  return adjustedMaxScroll;
};

