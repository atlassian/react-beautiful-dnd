// @flow
/* eslint-disable react/no-multi-comp */
import { createBox, type Spacing, type BoxModel } from 'css-box-model';
import React, { useMemo, type Node } from 'react';
import useDroppableDimensionPublisher from '../../../../../src/view/use-droppable-dimension-publisher/use-droppable-dimension-publisher';
import { getComputedSpacing, getPreset } from '../../../../util/dimension';
import { type DimensionMarshal } from '../../../../../src/state/dimension-marshal/dimension-marshal-types';
import type {
  ScrollOptions,
  DroppableId,
  DroppableDescriptor,
  TypeId,
} from '../../../../../src/types';
import createRef from '../../../../util/create-ref';
import AppContext, {
  type AppContextValue,
} from '../../../../../src/view/context/app-context';

export const scheduled: ScrollOptions = {
  shouldPublishImmediately: false,
};
export const immediate: ScrollOptions = {
  shouldPublishImmediately: true,
};

export const preset = getPreset();

export const margin: Spacing = {
  top: 1,
  right: 2,
  bottom: 3,
  left: 4,
};
export const padding: Spacing = {
  top: 5,
  right: 6,
  bottom: 7,
  left: 8,
};
export const border: Spacing = {
  top: 9,
  right: 10,
  bottom: 11,
  left: 12,
};
export const smallFrameClient: BoxModel = createBox({
  borderBox: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
  },
  margin,
  padding,
  border,
});

export const bigClient: BoxModel = createBox({
  borderBox: {
    top: 0,
    left: 0,
    right: 200,
    bottom: 200,
  },
  margin,
  padding,
  border,
});

const withSpacing = getComputedSpacing({ padding, margin, border });

export const descriptor: DroppableDescriptor = preset.home.descriptor;

type WithAppContextProps = {|
  marshal: DimensionMarshal,
  children: Node,
|};

export function WithAppContext(props: WithAppContextProps) {
  const context: AppContextValue = useMemo(
    () => ({
      marshal: props.marshal,
      style: 'fake',
      canLift: () => true,
      isMovementAllowed: () => true,
    }),
    [props.marshal],
  );

  return (
    <AppContext.Provider value={context}>{props.children}</AppContext.Provider>
  );
}

type ScrollableItemProps = {|
  type?: TypeId,
  isScrollable?: boolean,
  isDropDisabled?: boolean,
  isCombineEnabled?: boolean,
  droppableId?: DroppableId,
|};

export function ScrollableItem(props: ScrollableItemProps) {
  const droppableRef = createRef();
  const placeholderRef = createRef();
  // originally tests where made with this as the default
  const isScrollable: boolean = props.isScrollable !== false;

  useDroppableDimensionPublisher({
    droppableId: props.droppableId || descriptor.id,
    type: props.type || descriptor.type,
    direction: preset.home.axis.direction,
    isDropDisabled: props.isDropDisabled || false,
    ignoreContainerClipping: false,
    getDroppableRef: droppableRef.getRef,
    getPlaceholderRef: placeholderRef.getRef,
    isCombineEnabled: props.isCombineEnabled || false,
  });

  return (
    <div
      className="scroll-container"
      style={{
        boxSizing: 'border-box',
        height: bigClient.borderBox.height,
        width: bigClient.borderBox.width,
        ...withSpacing,
        overflowX: isScrollable ? 'scroll' : 'visible',
        overflowY: isScrollable ? 'scroll' : 'visible',
      }}
      ref={droppableRef.setRef}
    >
      hi
      <div className="placeholder" ref={placeholderRef.setRef} />
    </div>
  );
}

type AppProps = {|
  droppableIsScrollable?: boolean,
  parentIsScrollable?: boolean,
  ignoreContainerClipping?: boolean,
  showPlaceholder?: boolean,
|};

export function App(props: AppProps) {
  const droppableRef = createRef();
  const placeholderRef = createRef();

  const {
    droppableIsScrollable = false,
    parentIsScrollable = false,
    ignoreContainerClipping = false,
    showPlaceholder = false,
  } = props;

  useDroppableDimensionPublisher({
    droppableId: descriptor.id,
    direction: 'vertical',
    isDropDisabled: false,
    isCombineEnabled: false,
    type: descriptor.type,
    ignoreContainerClipping,
    getDroppableRef: droppableRef.getRef,
    getPlaceholderRef: placeholderRef.getRef,
  });

  return (
    <div
      className="scroll-parent"
      style={{
        boxSizing: 'border-box',
        height: smallFrameClient.borderBox.height,
        width: smallFrameClient.borderBox.width,
        ...withSpacing,
        // setting both manually. This will be done automatically if setting overflow: scroll
        overflowX: parentIsScrollable ? 'scroll' : 'visible',
        overflowY: parentIsScrollable ? 'scroll' : 'visible',
      }}
    >
      <div>
        <div
          ref={droppableRef.setRef}
          className="droppable"
          style={{
            boxSizing: 'border-box',
            height: bigClient.borderBox.height,
            width: bigClient.borderBox.width,
            ...withSpacing,
            // setting both manually. This will be done automatically if setting overflow: scroll
            overflowX: droppableIsScrollable ? 'scroll' : 'visible',
            overflowY: droppableIsScrollable ? 'scroll' : 'visible',
          }}
        >
          <div>hello world</div>
          {showPlaceholder ? (
            <div className="placeholder" ref={placeholderRef.setRef} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
