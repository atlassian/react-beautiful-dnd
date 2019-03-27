// @flow
/* eslint-disable react/no-multi-comp */
import { createBox, type Spacing, type BoxModel } from 'css-box-model';
import React, { Component } from 'react';
import useDroppableDimensionPublisher from '../../../../../src/view/use-droppable-dimension-publisher/use-droppable-dimension-publisher';
import { getComputedSpacing, getPreset } from '../../../../utils/dimension';
import { type DimensionMarshal } from '../../../../../src/state/dimension-marshal/dimension-marshal-types';
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
  marshal: DimensionMarshal,
|};

function ScrollableItem(props: ScrollableItemProps) {
  const
}


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
  placeholderRef: ?HTMLElement;

  setRef = (ref: ?HTMLElement) => {
    this.ref = ref;
  };

  setPlaceholderRef = (ref: ?HTMLElement) => {
    this.placeholderRef = ref;
  };

  getRef = (): ?HTMLElement => this.ref;
  getPlaceholderRef = (): ?HTMLElement => this.placeholderRef;

  render() {
    return (
      <DroppableDimensionPublisher
        droppableId={this.props.droppableId}
        type={this.props.type}
        direction={preset.home.axis.direction}
        isDropDisabled={this.props.isDropDisabled}
        ignoreContainerClipping={false}
        getDroppableRef={this.getRef}
        getPlaceholderRef={this.getPlaceholderRef}
        isCombineEnabled={this.props.isCombineEnabled}
      >
        <div
          className="scroll-container"
          style={{
            boxSizing: 'border-box',
            height: bigClient.borderBox.height,
            width: bigClient.borderBox.width,
            ...withSpacing,
            overflowX: this.props.isScrollable ? 'scroll' : 'visible',
            overflowY: this.props.isScrollable ? 'scroll' : 'visible',
          }}
          ref={this.setRef}
        >
          hi
          <div className="placeholder" ref={this.setPlaceholderRef} />
        </div>
      </DroppableDimensionPublisher>
    );
  }
}

type AppProps = {|
  droppableIsScrollable: boolean,
  parentIsScrollable: boolean,
  ignoreContainerClipping: boolean,
  showPlaceholder: boolean,
|};

export class App extends Component<AppProps> {
  ref: ?HTMLElement;
  placeholderRef: ?HTMLElement;

  static defaultProps = {
    ignoreContainerClipping: false,
    droppableIsScrollable: false,
    parentIsScrollable: false,
    showPlaceholder: false,
  };

  setRef = (ref: ?HTMLElement) => {
    this.ref = ref;
  };

  setPlaceholderRef = (ref: ?HTMLElement) => {
    this.placeholderRef = ref;
  };

  getRef = (): ?HTMLElement => this.ref;
  getPlaceholderRef = (): ?HTMLElement => this.placeholderRef;

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
          // setting both manually. This will be done automatically if setting overflow: scroll
          overflowX: parentIsScrollable ? 'scroll' : 'visible',
          overflowY: parentIsScrollable ? 'scroll' : 'visible',
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
              // setting both manually. This will be done automatically if setting overflow: scroll
              overflowX: droppableIsScrollable ? 'scroll' : 'visible',
              overflowY: droppableIsScrollable ? 'scroll' : 'visible',
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
              getPlaceholderRef={this.getPlaceholderRef}
            >
              <div>hello world</div>
              {this.props.showPlaceholder ? (
                <div className="placeholder" ref={this.setPlaceholderRef} />
              ) : null}
            </DroppableDimensionPublisher>
          </div>
        </div>
      </div>
    );
  }
}
