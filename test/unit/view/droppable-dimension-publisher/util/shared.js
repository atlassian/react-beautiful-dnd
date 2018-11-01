// @flow
/* eslint-disable react/no-multi-comp */
import { createBox, type Spacing, type BoxModel } from 'css-box-model';
import React, { Component } from 'react';
import DroppableDimensionPublisher from '../../../../../src/view/droppable-dimension-publisher/droppable-dimension-publisher';
import { getComputedSpacing, getPreset } from '../../../../utils/dimension';
import type {
  ScrollOptions,
  DroppableId,
  DroppableDescriptor,
  TypeId,
} from '../../../../../src/types';

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

type ScrollableItemProps = {|
  // scrollable item prop (default: false)
  isScrollable: boolean,
  isDropDisabled: boolean,
  isCombineEnabled: boolean,
  droppableId: DroppableId,
  type: TypeId,
|};

export class ScrollableItem extends React.Component<ScrollableItemProps> {
  static defaultProps = {
    isScrollable: true,
    type: descriptor.type,
    droppableId: descriptor.id,
    isDropDisabled: false,
    isCombineEnabled: false,
  };
  /* eslint-disable react/sort-comp */
  ref: ?HTMLElement;

  setRef = (ref: ?HTMLElement) => {
    this.ref = ref;
  };

  getRef = (): ?HTMLElement => this.ref;

  render() {
    return (
      <DroppableDimensionPublisher
        droppableId={this.props.droppableId}
        type={this.props.type}
        direction={preset.home.axis.direction}
        isDropDisabled={this.props.isDropDisabled}
        ignoreContainerClipping={false}
        getDroppableRef={this.getRef}
        isCombineEnabled={this.props.isCombineEnabled}
      >
        <div
          className="scroll-container"
          style={{
            boxSizing: 'border-box',
            height: bigClient.borderBox.height,
            width: bigClient.borderBox.width,
            ...withSpacing,
            overflow: this.props.isScrollable ? 'scroll' : 'visible',
          }}
          ref={this.setRef}
        >
          hi
        </div>
      </DroppableDimensionPublisher>
    );
  }
}

type AppProps = {|
  droppableIsScrollable: boolean,
  parentIsScrollable: boolean,
  ignoreContainerClipping: boolean,
|};

export class App extends Component<AppProps> {
  ref: ?HTMLElement;
  static defaultProps = {
    ignoreContainerClipping: false,
    droppableIsScrollable: false,
    parentIsScrollable: false,
  };

  setRef = (ref: ?HTMLElement) => {
    this.ref = ref;
  };
  getRef = (): ?HTMLElement => this.ref;

  render() {
    const {
      droppableIsScrollable,
      parentIsScrollable,
      ignoreContainerClipping,
    } = this.props;
    return (
      <div
        className="scroll-parent"
        style={{
          boxSizing: 'border-box',
          height: smallFrameClient.borderBox.height,
          width: smallFrameClient.borderBox.width,
          ...withSpacing,
          overflow: parentIsScrollable ? 'scroll' : 'visible',
        }}
      >
        <div>
          <div
            ref={this.setRef}
            className="droppable"
            style={{
              boxSizing: 'border-box',
              height: bigClient.borderBox.height,
              width: bigClient.borderBox.width,
              ...withSpacing,
              overflow: droppableIsScrollable ? 'scroll' : 'visible',
            }}
          >
            <DroppableDimensionPublisher
              droppableId={descriptor.id}
              direction="vertical"
              isDropDisabled={false}
              isCombineEnabled={false}
              type={descriptor.type}
              ignoreContainerClipping={ignoreContainerClipping}
              getDroppableRef={this.getRef}
            >
              <div>hello world</div>
            </DroppableDimensionPublisher>
          </div>
        </div>
      </div>
    );
  }
}
