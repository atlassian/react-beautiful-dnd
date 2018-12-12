// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DroppableDimensionPublisher from '../droppable-dimension-publisher';
import type { Props, Provided, StateSnapshot } from './droppable-types';
import type {
  DroppableId,
  TypeId,
  Placeholder as PlaceholderType,
} from '../../types';
import Placeholder from '../placeholder';
import throwIfRefIsInvalid from '../throw-if-invalid-inner-ref';
import {
  droppableIdKey,
  droppableTypeKey,
  styleContextKey,
} from '../context-keys';
import { warning } from '../../dev-warning';
import checkOwnProps from './check-own-props';
import AnimateMount, {
  type AnimateProvided,
} from '../animate-mount/animate-mount';

type Context = {
  [string]: DroppableId | TypeId,
};

export default class Droppable extends Component<Props> {
  /* eslint-disable react/sort-comp */
  styleContext: string;
  ref: ?HTMLElement = null;
  placeholderRef: ?HTMLElement = null;

  // Need to declare childContextTypes without flow
  static contextTypes = {
    [styleContextKey]: PropTypes.string.isRequired,
  };

  constructor(props: Props, context: Object) {
    super(props, context);

    this.styleContext = context[styleContextKey];

    // a little run time check to avoid an easy to catch setup issues
    if (process.env.NODE_ENV !== 'production') {
      checkOwnProps(props);
    }
  }

  // Need to declare childContextTypes without flow
  // https://github.com/brigand/babel-plugin-flow-react-proptypes/issues/22
  static childContextTypes = {
    [droppableIdKey]: PropTypes.string.isRequired,
    [droppableTypeKey]: PropTypes.string.isRequired,
  };

  getChildContext(): Context {
    const value: Context = {
      [droppableIdKey]: this.props.droppableId,
      [droppableTypeKey]: this.props.type,
    };
    return value;
  }

  componentDidMount() {
    throwIfRefIsInvalid(this.ref);
    this.warnIfPlaceholderNotMounted();
  }

  componentDidUpdate() {
    this.warnIfPlaceholderNotMounted();
  }

  componentWillUnmount() {
    // allowing garbage collection
    this.ref = null;
    this.placeholderRef = null;
  }

  warnIfPlaceholderNotMounted() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    if (!this.props.placeholder) {
      return;
    }

    if (this.placeholderRef) {
      return;
    }

    warning(`
      Droppable setup issue: DroppableProvided > placeholder could not be found.
      Please be sure to add the {provided.placeholder} Node as a child of your Droppable

      More information: https://github.com/atlassian/react-beautiful-dnd#1-provided-droppableprovided
    `);
  }

  /* eslint-enable */

  setPlaceholderRef = (ref: ?HTMLElement) => {
    this.placeholderRef = ref;
  };

  getPlaceholderRef = () => this.placeholderRef;

  // React calls ref callback twice for every render
  // https://github.com/facebook/react/pull/8333/files
  setRef = (ref: ?HTMLElement) => {
    if (ref === null) {
      return;
    }

    if (ref === this.ref) {
      return;
    }

    this.ref = ref;
    throwIfRefIsInvalid(ref);
  };

  getDroppableRef = (): ?HTMLElement => this.ref;

  getPlaceholder() {
    const raw: ?PlaceholderType = this.props.placeholder;

    return (
      <AnimateMount show={Boolean(raw)} data={raw} isAnimationEnabled>
        {({ isVisible, onClose, data, animate }: AnimateProvided) =>
          isVisible && (
            <Placeholder
              placeholder={(data: any)}
              onClose={onClose}
              innerRef={this.setPlaceholderRef}
              animate={animate}
            />
          )
        }
      </AnimateMount>
    );
  }

  render() {
    const {
      // ownProps
      children,
      direction,
      type,
      droppableId,
      isDropDisabled,
      isCombineEnabled,
      // mapProps
      ignoreContainerClipping,
      isDraggingOver,
      draggingOverWith,
    } = this.props;

    const provided: Provided = {
      innerRef: this.setRef,
      placeholder: this.getPlaceholder(),
      droppableProps: {
        'data-react-beautiful-dnd-droppable': this.styleContext,
      },
    };
    const snapshot: StateSnapshot = {
      isDraggingOver,
      draggingOverWith,
    };

    return (
      <DroppableDimensionPublisher
        droppableId={droppableId}
        type={type}
        direction={direction}
        ignoreContainerClipping={ignoreContainerClipping}
        isDropDisabled={isDropDisabled}
        isCombineEnabled={isCombineEnabled}
        getDroppableRef={this.getDroppableRef}
        getPlaceholderRef={this.getPlaceholderRef}
      >
        {children(provided, snapshot)}
      </DroppableDimensionPublisher>
    );
  }
}
