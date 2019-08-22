// @flow
import React from 'react';
import { render } from '@testing-library/react';
import * as attributes from '../../../../src/view/data-attributes';
import {
  renderItemAndSpy,
  isClone,
  getCallsFor,
  getLast,
  type Call,
  isDragging,
  isDropAnimating,
  isOver,
} from '../util/helpers';
import expandedMouse from '../util/expanded-mouse';
import Board, { withPoorBoardDimensions } from '../util/board';
import { toDroppableList } from '../../../../src/state/dimension-structures';

function hasPlaceholder(droppableId: DroppableId, el: HTMLElement): boolean {
  const placeholder: ?HTMLElement = el.querySelector(
    `[${attributes.droppable.id}="${droppableId}"] [${attributes.placeholder.contextId}]`,
  );
  return Boolean(placeholder);
}

it('should not render a placeholder at rest', () => {
  withPoorBoardDimensions(preset => {
    const { container } = render(<Board />);

    toDroppableList(preset.droppables).forEach(droppable => {
      expect(hasPlaceholder(droppable.descriptor.id, container)).toBe(false);
    });
  });
});

it('should render a placeholder when dragging over', () => {
  withPoorBoardDimensions(preset => {
    toDroppableList(preset.droppables).forEach(droppable => {
      const { container, getByTestId, unmount } = render(<Board />);
      const handle: HTMLElement = getByTestId(preset.inHome1.descriptor.id);
      const box0 = preset.inHome1.client.borderBox;

      expandedMouse.powerLift(handle, box0.center);
      expandedMouse.move(handle, droppable.client.borderBox.center);

      expect(isOver(handle)).toBe(droppable.descriptor.id);
      expect(hasPlaceholder(droppable.descriptor.id, container)).toBe(true);

      unmount();
    });
  });
});

it('should always render a placeholder in the home list while dragging', () => {
  withPoorBoardDimensions(preset => {
    toDroppableList(preset.droppables).forEach(droppable => {
      const { container, getByTestId, unmount } = render(<Board />);
      const handle: HTMLElement = getByTestId(preset.inHome1.descriptor.id);
      const box0 = preset.inHome1.client.borderBox;

      expandedMouse.powerLift(handle, box0.center);
      expandedMouse.move(handle, droppable.client.borderBox.center);

      // doesn't matter what we are over
      expect(isOver(handle)).toBe(droppable.descriptor.id);
      // there is always a placeholder in home
      expect(hasPlaceholder(preset.home.descriptor.id, container)).toBe(true);

      unmount();
    });
  });
});

it('should not render a placeholder in a foreign list if not dragging over', () => {
  withPoorBoardDimensions(preset => {
    const { container, getByTestId } = render(<Board />);
    const handle: HTMLElement = getByTestId(preset.inHome1.descriptor.id);
    const box0 = preset.inHome1.client.borderBox;

    expandedMouse.powerLift(handle, box0.center);

    expect(isOver(handle)).toBe(preset.home.descriptor.id);
    expect(hasPlaceholder(preset.foreign.descriptor.id, container)).toBe(false);
  });
});
