// @flow
import React from 'react';

class WithConditionalPlaceholder extends React.Component<{|
  provided: Provided,
|}> {
  render() {
    return (
      <div
        ref={this.props.provided.innerRef}
        {...this.props.provided.droppableProps}
      >
        Not rendering placeholder
      </div>
    );
  }
}

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  console.warn.mockRestore();
});

it('should log a warning when mounting', () => {
  mount({
    mapProps: isDraggingOverForeignMapProps,
    WrappedComponent: WithConditionalPlaceholder,
  });

  expect(console.warn).toHaveBeenCalledWith(
    expect.stringContaining(
      'Droppable setup issue: DroppableProvided > placeholder could not be found.',
    ),
  );
});

it('should log a warning when updating', () => {
  const wrapper = mount({
    mapProps: notDraggingOverMapProps,
    WrappedComponent: WithConditionalPlaceholder,
  });

  wrapper.setProps(isDraggingOverForeignMapProps);

  expect(console.warn).toHaveBeenCalledWith(
    expect.stringContaining(
      'Droppable setup issue: DroppableProvided > placeholder could not be found.',
    ),
  );
});
