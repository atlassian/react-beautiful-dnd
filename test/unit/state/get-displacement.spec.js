// @flow
import { getRect, type Rect } from 'css-box-model';
import getDisplacement from '../../../src/state/get-displacement';
import noImpact from '../../../src/state/no-impact';
import { getDroppableDimension, getDraggableDimension } from '../../utils/dimension';
import type {
  Displacement,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
} from '../../../src/types';

const viewport: Rect = getRect({
  top: 0,
  right: 800,
  left: 0,
  bottom: 600,
});

const subject: Rect = getRect({
  top: 0,
  left: 0,
  right: 800,
  // much longer than viewport
  bottom: 2000,
});

const droppable: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'drop',
    type: 'TYPE',
  },
  borderBox: subject,
});

const inViewport: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'in-viewport',
    droppableId: droppable.descriptor.id,
    type: droppable.descriptor.type,
    index: 0,
  },
  borderBox: {
    top: 0,
    left: 0,
    right: 200,
    bottom: 200,
  },
});

const notInViewport: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'not-in-viewport',
    droppableId: droppable.descriptor.id,
    type: droppable.descriptor.type,
    index: 1,
  },
  // outside of viewport but within droppable
  borderBox: {
    top: 810,
    left: 0,
    right: 200,
    bottom: 850,
  },
});

describe('get displacement', () => {
  describe('fresh displacement', () => {
    it('should set visibility to true and permit animation if draggable is visible', () => {
      const displacement: Displacement = getDisplacement({
        draggable: inViewport,
        destination: droppable,
        previousImpact: noImpact,
        viewport,
      });

      expect(displacement).toEqual({
        draggableId: inViewport.descriptor.id,
        isVisible: true,
        shouldAnimate: true,
      });
    });

    it('should set visibility to false and disable animation if draggable is not visible', () => {
      const displacement: Displacement = getDisplacement({
        draggable: notInViewport,
        destination: droppable,
        previousImpact: noImpact,
        viewport,
      });

      expect(displacement).toEqual({
        draggableId: notInViewport.descriptor.id,
        isVisible: false,
        shouldAnimate: false,
      });
    });
  });

  describe('subsequent displacements', () => {
    describe('element is still visible', () => {
      it('should keep the displacement visible and allow animation', () => {
        const previousImpact: DragImpact = {
          direction: droppable.axis.direction,
          movement: {
          // faking a previous displacement
            displaced: [{
              draggableId: inViewport.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            }],
            // not populating correctly
            amount: { x: 0, y: 0 },
            isBeyondStartPosition: false,
          },
          // not populating correctly
          destination: {
            droppableId: droppable.descriptor.id,
            index: 0,
          },
        };

        const displacement: Displacement = getDisplacement({
          draggable: inViewport,
          destination: droppable,
          previousImpact,
          viewport,
        });

        expect(displacement).toEqual({
          draggableId: inViewport.descriptor.id,
          isVisible: true,
          shouldAnimate: true,
        });
      });
    });

    describe('element is still not visible', () => {
      it('should continue to indicate that the displacement is not visible and not to be animated', () => {
        const previousImpact: DragImpact = {
          direction: droppable.axis.direction,
          movement: {
            // faking a previous displacement
            displaced: [{
              draggableId: notInViewport.descriptor.id,
              isVisible: false,
              shouldAnimate: false,
            }],
            // not populating correctly
            amount: { x: 0, y: 0 },
            isBeyondStartPosition: false,
          },
          // not populating correctly
          destination: {
            droppableId: droppable.descriptor.id,
            index: 0,
          },
        };

        const displacement: Displacement = getDisplacement({
          draggable: notInViewport,
          destination: droppable,
          previousImpact,
          viewport,
        });

        expect(displacement).toEqual({
          draggableId: notInViewport.descriptor.id,
          isVisible: false,
          shouldAnimate: false,
        });
      });
    });

    describe('element was not visible and now is', () => {
      it('should indicate that the element is visible, but that animation is not allowed', () => {
        const previousImpact: DragImpact = {
          direction: droppable.axis.direction,
          movement: {
            // faking a previous displacement
            displaced: [{
              draggableId: notInViewport.descriptor.id,
              isVisible: false,
              shouldAnimate: false,
            }],
            // not populating correctly
            amount: { x: 0, y: 0 },
            isBeyondStartPosition: false,
          },
          // not populating correctly
          destination: {
            droppableId: droppable.descriptor.id,
            index: 0,
          },
        };
        // scrolled down 800px
        const scrolledViewport: Rect = getRect({
          top: 800,
          right: 800,
          left: 0,
          bottom: 1200,
        });

        const displacement: Displacement = getDisplacement({
          draggable: notInViewport,
          destination: droppable,
          previousImpact,
          viewport: scrolledViewport,
        });

        expect(displacement).toEqual({
          draggableId: notInViewport.descriptor.id,
          isVisible: true,
          shouldAnimate: false,
        });
      });
    });

    describe('element was visible but now is not', () => {
      it('should indicate that the draggable is not visible and that animation should not occur', () => {
        const previousImpact: DragImpact = {
          direction: droppable.axis.direction,
          movement: {
            // faking a previous displacement
            displaced: [{
              draggableId: inViewport.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            }],
            // not populating correctly
            amount: { x: 0, y: 0 },
            isBeyondStartPosition: false,
          },
          // not populating correctly
          destination: {
            droppableId: droppable.descriptor.id,
            index: 0,
          },
        };
        // scrolled down 800px
        const scrolledViewport: Rect = getRect({
          top: 800,
          right: 800,
          left: 0,
          bottom: 1200,
        });

        const displacement: Displacement = getDisplacement({
          draggable: inViewport,
          destination: droppable,
          previousImpact,
          viewport: scrolledViewport,
        });

        expect(displacement).toEqual({
          draggableId: inViewport.descriptor.id,
          isVisible: false,
          shouldAnimate: false,
        });
      });
    });
  });
});
