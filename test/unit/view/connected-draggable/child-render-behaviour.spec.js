// @flow
import React, { Component } from 'react';
import { mount } from 'enzyme';
import {
  combine,
  withStore,
  withDroppableId,
  withDroppableType,
  withDimensionMarshal,
  withStyleContext,
  withCanLift,
} from '../../../utils/get-context-options';
import type { DimensionMarshal } from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import {
  getMarshalStub,
  getDroppableCallbacks,
} from '../../../utils/dimension-marshal';
import { getPreset } from '../../../utils/dimension';
import forceUpdate from '../../../utils/force-update';
import Draggable from '../../../../src/view/draggable/connected-draggable';
import type { Provided } from '../../../../src/view/draggable/draggable-types';

const preset = getPreset();
// creating our own marshal so we can publish a droppable
// so that the draggable can publish itself
const marshal: DimensionMarshal = getMarshalStub();
const options: Object = combine(
  withStore(),
  withDroppableId(preset.home.descriptor.id),
  withDroppableType(preset.home.descriptor.type),
  withDimensionMarshal(marshal),
  withStyleContext(),
  withCanLift(),
);

// registering a fake droppable so that when a draggable
// registers itself the marshal can find its parent
marshal.registerDroppable(
  preset.home.descriptor,
  getDroppableCallbacks(preset.home),
);

class Person extends Component<{ name: string, provided: Provided }> {
  render() {
    const { provided, name } = this.props;
    return (
      <div
        ref={ref => provided.innerRef(ref)}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        hello {name}
      </div>
    );
  }
}

class App extends Component<{ currentUser: string }> {
  render() {
    return (
      <Draggable draggableId="drag-1">
        {(dragProvided: Provided) => (
          <Person name={this.props.currentUser} provided={dragProvided} />
        )}
      </Draggable>
    );
  }
}

beforeEach(() => {
  jest.spyOn(Person.prototype, 'render');
});

afterEach(() => {
  Person.prototype.render.mockRestore();
});

it('should render the child function when the parent renders', () => {
  const wrapper = mount(<App currentUser="Jake" />, options);

  expect(Person.prototype.render).toHaveBeenCalledTimes(1);
  expect(wrapper.find(Person).props().name).toBe('Jake');

  wrapper.unmount();
});

it('should render the child function when the parent re-renders', () => {
  const wrapper = mount(<App currentUser="Jake" />, options);

  forceUpdate(wrapper);

  expect(Person.prototype.render).toHaveBeenCalledTimes(2);
  expect(wrapper.find(Person).props().name).toBe('Jake');

  wrapper.unmount();
});

it('should render the child function when the parents props changes that cause a re-render', () => {
  const wrapper = mount(<App currentUser="Jake" />, options);

  wrapper.setProps({
    currentUser: 'Finn',
  });

  expect(Person.prototype.render).toHaveBeenCalledTimes(2);
  expect(wrapper.find(Person).props().name).toBe('Finn');

  wrapper.unmount();
});
