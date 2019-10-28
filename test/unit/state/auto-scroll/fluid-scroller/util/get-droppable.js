// @flow
import { createBox, type BoxModel } from 'css-box-model';
import type { DroppableDimension } from '../../../../../../src/types';
import { origin } from '../../../../../../src/state/position';
import { getDroppableDimension } from '../../../../../util/dimension';

export default (preset: Object) => {
  const scrollableScrollSize = {
    scrollWidth: 800,
    scrollHeight: 800,
  };
  const frameClient: BoxModel = createBox({
    borderBox: {
      top: 0,
      left: 0,
      right: 600,
      bottom: 600,
    },
  });

  const scrollable: DroppableDimension = getDroppableDimension({
    // stealing the home descriptor
    descriptor: preset.home.descriptor,
    direction: preset.home.axis.direction,
    borderBox: {
      top: 0,
      left: 0,
      // bigger than the frame
      right: scrollableScrollSize.scrollWidth,
      bottom: scrollableScrollSize.scrollHeight,
    },
    closest: {
      borderBox: frameClient.borderBox,
      scrollSize: {
        scrollWidth: scrollableScrollSize.scrollWidth,
        scrollHeight: scrollableScrollSize.scrollHeight,
      },
      scroll: origin,
      shouldClipSubject: true,
    },
  });

  return { scrollable, frameClient, scrollableScrollSize };
};
