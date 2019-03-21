// @flow
import type {
  State,
  DragImpact,
  DraggingState,
  DropAnimatingState,
} from '../../../../src/types';
import type {
  OwnProps,
  Selector,
  MapProps,
} from '../../../../src/view/droppable/droppable-types';
import { makeMapStateToProps } from '../../../../src/view/droppable/connected-droppable';
import { getPreset } from '../../../utils/dimension';
import getStatePreset from '../../../utils/get-simple-state-preset';
import getOwnProps from './util/get-own-props';
import { withImpact } from '../../../utils/dragging-state';
import { forward } from '../../../../src/state/user-direction/user-direction-preset';
import noImpact from '../../../../src/state/no-impact';
import cloneImpact from '../../../utils/clone-impact';

const preset = getPreset();
const state = getStatePreset();

describe('home list', () => {
  describe('was being dragged over', () => {
    const isOverMapProps: MapProps = {
      placeholder: preset.inHome1.placeholder,
      shouldAnimatePlaceholder: false,
      snapshot: {
        isDraggingOver: true,
        draggingOverWith: preset.inHome1.descriptor.id,
        draggingFromThisWith: preset.inHome1.descriptor.id,
      },
    };

    it('should not break memoization from a reorder', () => {
      const ownProps: OwnProps = getOwnProps(preset.home);
      const selector: Selector = makeMapStateToProps();

      const whileDragging: MapProps = selector(state.dragging(), ownProps);
      const whileDropping: MapProps = selector(state.dropAnimating(), ownProps);

      expect(whileDragging).toEqual(isOverMapProps);
      // referential equality: memoization check
      expect(whileDragging).toBe(whileDropping);
    });

    it('should not break memoization from a combine', () => {
      const ownProps: OwnProps = getOwnProps(preset.home);
      const selector: Selector = makeMapStateToProps();
      const combine: DragImpact = {
        ...state.dragging().impact,
        destination: null,
        merge: {
          whenEntered: forward,
          combine: {
            draggableId: preset.inHome2.descriptor.id,
            droppableId: preset.inHome2.descriptor.droppableId,
          },
        },
      };
      const base: DropAnimatingState = state.dropAnimating();
      const droppingState: DropAnimatingState = {
        ...base,
        completed: {
          ...base.completed,
          impact: combine,
        },
      };

      const whileDragging: MapProps = selector(
        withImpact(state.dragging(), combine),
        ownProps,
      );
      const whileDropping: MapProps = selector(droppingState, ownProps);

      expect(whileDragging).toEqual(isOverMapProps);
      // referential equality: memoization check
      expect(whileDragging).toBe(whileDropping);
    });

    it('should use the completed.result and not the completed.impact for determining if over', () => {
      const ownProps: OwnProps = getOwnProps(preset.home);
      const selector: Selector = makeMapStateToProps();

      const stateWhenDropping: DropAnimatingState = state.userCancel();
      // the impact has the home destination
      expect(stateWhenDropping.completed.impact.destination).toBeTruthy();
      // the user facing result has been cleared
      expect(stateWhenDropping.completed.result.destination).toBe(null);

      const whileDropping: MapProps = selector(stateWhenDropping, ownProps);
      const expected: MapProps = {
        placeholder: preset.inHome1.placeholder,
        shouldAnimatePlaceholder: false,
        snapshot: {
          // still the home list so this is populated
          draggingFromThisWith: preset.inHome1.descriptor.id,
          // cleared from result and cleared version is given to consumer
          isDraggingOver: false,
          draggingOverWith: null,
        },
      };
      expect(whileDropping).toEqual(expected);
    });
  });

  describe('was not being dragged over', () => {
    it('should maintain a placeholder and not break memoization', () => {
      const ownProps: OwnProps = getOwnProps(preset.home);
      const selector: Selector = makeMapStateToProps();
      const isHomeButNotOver: MapProps = {
        placeholder: preset.inHome1.placeholder,
        shouldAnimatePlaceholder: false,
        snapshot: {
          isDraggingOver: false,
          draggingOverWith: null,
          draggingFromThisWith: preset.inHome1.descriptor.id,
        },
      };

      const whileDragging: DraggingState = {
        ...state.dragging(preset.inHome1.descriptor.id),
        impact: cloneImpact(noImpact),
      };
      const base: DropAnimatingState = state.dropAnimating();
      const whileDropping: DropAnimatingState = {
        ...base,
        completed: {
          ...base.completed,
          impact: cloneImpact(noImpact),
          result: {
            ...base.completed.result,
            destination: null,
          },
        },
      };

      // correct value
      const first: MapProps = selector(whileDropping, ownProps);
      expect(first).toEqual(isHomeButNotOver);

      // no memoization break between steps
      expect(selector(whileDragging, ownProps)).toBe(first);
      expect(selector(whileDropping, ownProps)).toBe(first);
    });
  });
});
it('should return the default props for every phase for a foreign list', () => {
  const ownProps: OwnProps = getOwnProps(preset.foreign);
  const selector: Selector = makeMapStateToProps();
  const defaultProps: MapProps = selector(state.idle, ownProps);

  [...state.allPhases(), ...state.allPhases().reverse()].forEach(
    (current: State) => {
      expect(selector(current, ownProps)).toBe(defaultProps);
    },
  );
});
