// @flow
import { getWrapper, Child } from './util/wrappers';
import { getStubCallbacks } from './util/callbacks';
import basicContext from './util/app-context';

it('should apply the style context to a data-attribute', () => {
  expect(
    getWrapper(getStubCallbacks())
      .find(Child)
      .getDOMNode()
      .getAttribute('data-react-beautiful-dnd-drag-handle'),
  ).toEqual(basicContext.style);
});

it('should apply a default aria roledescription containing lift instructions', () => {
  expect(
    getWrapper(getStubCallbacks())
      .find(Child)
      .getDOMNode()
      .getAttribute('aria-roledescription'),
  ).toEqual('Draggable item. Press space bar to lift');
});
