// @flow
import React, { type Node } from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import type {
  Props,
  OwnProps,
  MapProps,
  DispatchProps,
  Provided,
  StateSnapshot,
} from '../../../../../src/view/draggable/draggable-types';
import type { StyleMarshal } from '../../../../../src/view/use-style-marshal/style-marshal-types';
import {
  atRestMapProps,
  getDispatchPropsStub,
  droppable,
  defaultOwnProps,
} from './get-props';
import Item from './item';
import Draggable from '../../../../../src/view/draggable/draggable';
import AppContext, {
  type AppContextValue,
} from '../../../../../src/view/context/app-context';
import DroppableContext, {
  type DroppableContextValue,
} from '../../../../../src/view/context/droppable-context';
import { getMarshalStub } from '../../../../utils/dimension-marshal';

type MountConnected = {|
  ownProps?: OwnProps,
  mapProps?: MapProps,
  dispatchProps?: DispatchProps,
  WrappedComponent?: any,
  styleContext?: string,
|};

type PassThroughProps = {|
  ...Props,
  children: (props: Props) => Node,
|};
export class PassThrough extends React.Component<PassThroughProps> {
  render() {
    const { children, ...rest } = this.props;
    // $FlowFixMe - incorrectly typed child function
    return this.props.children(rest);
  }
}

export default ({
  ownProps = defaultOwnProps,
  mapProps = atRestMapProps,
  dispatchProps = getDispatchPropsStub(),
  WrappedComponent = Item,
  styleContext = 'fake-style-context',
}: MountConnected = {}): ReactWrapper<*> => {
  const droppableContext: DroppableContextValue = {
    droppableId: droppable.id,
    type: droppable.type,
  };

  const appContext: AppContextValue = {
    marshal: getMarshalStub(),
    style: styleContext,
    canLift: () => true,
    isMovementAllowed: () => true,
  };
  // Using PassThrough so that you can do .setProps on the root
  const wrapper: ReactWrapper<*> = mount(
    <PassThrough {...ownProps} {...mapProps} {...dispatchProps}>
      {(props: Props) => (
        <AppContext.Provider value={appContext}>
          <DroppableContext.Provider value={droppableContext}>
            <Draggable {...props}>
              {(provided: Provided, snapshot: StateSnapshot) => (
                <WrappedComponent provided={provided} snapshot={snapshot} />
              )}
            </Draggable>
          </DroppableContext.Provider>
        </AppContext.Provider>
      )}
    </PassThrough>,
  );

  return wrapper;
};
