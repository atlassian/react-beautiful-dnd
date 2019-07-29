// @flow
import invariant from 'tiny-invariant';
import {
  createBox,
  withScroll,
  type BoxModel,
  type Spacing,
  type Position,
} from 'css-box-model';
import getDroppableDimension from '../../../../src/state/droppable/get-droppable';
import { noSpacing } from '../../../../src/state/spacing';
import getMaxScroll from '../../../../src/state/get-max-scroll';
import { expandBySpacing } from '../../../utils/spacing';
import type {
  DroppableDescriptor,
  DroppableDimension,
  ScrollSize,
  Scrollable,
} from '../../../../src/types';

const descriptor: DroppableDescriptor = {
  id: 'drop-1',
  type: 'TYPE',
  mode: 'STANDARD',
};

const margin: Spacing = {
  top: 1,
  right: 2,
  bottom: 3,
  left: 4,
};
const padding: Spacing = {
  top: 5,
  right: 6,
  bottom: 7,
  left: 8,
};
const border: Spacing = {
  top: 9,
  right: 10,
  bottom: 11,
  left: 12,
};
const windowScroll: Position = {
  x: 50,
  y: 80,
};
const origin: Position = { x: 0, y: 0 };

const client: BoxModel = createBox({
  borderBox: {
    top: 10,
    right: 110,
    bottom: 90,
    left: 20,
  },
  margin,
  padding,
  border,
});
const page: BoxModel = withScroll(client, windowScroll);
const ten: Spacing = {
  top: 10,
  right: 10,
  bottom: 10,
  left: 10,
};

describe('closest scrollable', () => {
  describe('no closest scrollable', () => {
    it('should not have a closest scrollable if there is no closest scrollable', () => {
      const dimension: DroppableDimension = getDroppableDimension({
        descriptor,
        isEnabled: true,
        isCombineEnabled: false,
        isFixedOnPage: false,
        client,
        page,
        direction: 'vertical',
        closest: null,
      });

      expect(dimension.frame).toBe(null);
    });
  });

  describe('with a closest scrollable', () => {
    const dimension: DroppableDimension = getDroppableDimension({
      descriptor,
      isEnabled: true,
      client,
      page,
      direction: 'vertical',
      isCombineEnabled: false,
      isFixedOnPage: false,
      closest: {
        client,
        page,
        scrollSize: {
          scrollHeight: client.paddingBox.height,
          scrollWidth: client.paddingBox.width,
        },
        scroll: { x: 10, y: 10 },
        shouldClipSubject: true,
      },
    });

    it('should offset the frame client by the window scroll', () => {
      invariant(dimension.frame);
      expect(dimension.frame.pageMarginBox).toEqual(page.marginBox);
    });

    it('should capture the frame information', () => {
      const scrollSize: ScrollSize = {
        scrollHeight: client.paddingBox.height,
        scrollWidth: client.paddingBox.width,
      };
      const maxScroll: Position = getMaxScroll({
        // scrollHeight and scrollWidth are based on the padding box
        scrollHeight: scrollSize.scrollHeight,
        scrollWidth: scrollSize.scrollWidth,
        height: client.paddingBox.height,
        width: client.paddingBox.width,
      });
      const expected: Scrollable = {
        pageMarginBox: page.marginBox,
        frameClient: client,
        scrollSize,
        shouldClipSubject: true,
        scroll: {
          initial: { x: 10, y: 10 },
          current: { x: 10, y: 10 },
          max: maxScroll,
          diff: {
            value: { x: 0, y: 0 },
            displacement: { x: 0, y: 0 },
          },
        },
      };

      expect(dimension.frame).toEqual(expected);
    });
  });

  describe('frame clipping', () => {
    const frameClient: BoxModel = createBox({
      // bigger on every side by 10px
      borderBox: expandBySpacing(client.borderBox, ten),
      margin,
      border,
      padding,
    });
    const framePage: BoxModel = withScroll(frameClient, windowScroll);

    type Options = {|
      shouldClipSubject: boolean,
    |};

    const defaultOptions: Options = { shouldClipSubject: true };

    const getWithClient = (
      customClient: BoxModel,
      options?: Options = defaultOptions,
    ): DroppableDimension =>
      getDroppableDimension({
        descriptor,
        isEnabled: true,
        client: customClient,
        page: withScroll(customClient, windowScroll),
        isCombineEnabled: false,
        isFixedOnPage: false,
        direction: 'vertical',
        closest: {
          client: frameClient,
          page: framePage,
          scrollSize: {
            scrollHeight: client.paddingBox.height,
            scrollWidth: client.paddingBox.width,
          },
          scroll: origin,
          shouldClipSubject: options.shouldClipSubject,
        },
      });

    it('should not clip the frame if requested not to', () => {
      const expandedClient: BoxModel = createBox({
        borderBox: expandBySpacing(frameClient.borderBox, ten),
        margin,
        padding,
        border,
      });
      const expandedPage: BoxModel = withScroll(expandedClient, windowScroll);
      const bigClient: BoxModel = createBox({
        borderBox: expandedClient.borderBox,
        margin,
        padding,
        border,
      });

      const droppable: DroppableDimension = getWithClient(bigClient, {
        shouldClipSubject: false,
      });

      // Not clipped
      expect(droppable.subject.active).toEqual(expandedPage.marginBox);
      invariant(droppable.frame);
      expect(droppable.frame.shouldClipSubject).toBe(false);
    });

    describe('frame is the same size as the subject', () => {
      it('should not clip the subject', () => {
        const droppable: DroppableDimension = getWithClient(frameClient);

        expect(droppable.subject.active).toEqual(framePage.marginBox);
      });
    });

    describe('frame is smaller than subject', () => {
      it('should clip the subject to the size of the frame', () => {
        const bigClient: BoxModel = createBox({
          // expanding by 10px on each side
          borderBox: expandBySpacing(frameClient.borderBox, ten),
          margin,
          padding,
          border,
        });

        const droppable: DroppableDimension = getWithClient(bigClient);

        expect(droppable.subject.active).toEqual(framePage.marginBox);
      });
    });

    describe('frame is larger than subject', () => {
      it('should return a clipped size that is equal to that of the subject', () => {
        // client is already smaller than frame
        const droppable: DroppableDimension = getWithClient(client);

        expect(droppable.subject.active).toEqual(page.marginBox);
      });
    });

    describe('subject clipped on one side by frame', () => {
      it('should clip on all sides', () => {
        // each of these subjects bleeds out past the frame in one direction
        const changes: Spacing[] = [
          { top: -10, ...noSpacing },
          { left: -10, ...noSpacing },
          { bottom: 10, ...noSpacing },
          { right: 10, ...noSpacing },
        ];

        changes.forEach((expandBy: Spacing) => {
          const custom: BoxModel = createBox({
            borderBox: expandBySpacing(frameClient.borderBox, expandBy),
            margin,
            padding,
            border,
          });

          const droppable: DroppableDimension = getWithClient(custom);

          expect(droppable.subject.active).toEqual(framePage.marginBox);
        });
      });
    });
  });
});
