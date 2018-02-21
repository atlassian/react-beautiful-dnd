// @flow
import type {
  Position,
  Area,
} from '../../types';

type Args = {|
  container: Area,
  subject: Area,
  proposedScroll: Position,
|}

export default ({
  container,
  subject,
  proposedScroll,
}: Args): ?Position => {
  const isTooBigVertically: boolean = subject.height > container.height;
  const isTooBigHorizontally: boolean = subject.width > container.width;

  // not too big on any axis
  if (!isTooBigHorizontally && !isTooBigVertically) {
    return proposedScroll;
  }

  // too big on both axis
  if (isTooBigHorizontally && isTooBigVertically) {
    return null;
  }

  // only too big on one axis
  return {
    x: isTooBigHorizontally ? 0 : proposedScroll.x,
    y: isTooBigVertically ? 0 : proposedScroll.y,
  };
};
