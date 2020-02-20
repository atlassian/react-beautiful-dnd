// @flow
import React from 'react';
import { render } from '@testing-library/react';
import { isDragging } from './util/helpers';
import App from './util/app';
import { forEachSensor, simpleLift, type Control } from './util/controls';
import { withoutError, withoutWarn } from '../../util/console';

forEachSensor((control: Control) => {
  it('should not log any warnings when DOM is removed just before unmount while dragging', () => {
    const { unmount, getByText, container } = render(<App />);
    const handle: HTMLElement = getByText('item: 0');

    // mid drag
    simpleLift(control, handle);
    expect(isDragging(handle)).toEqual(true);

    withoutError(() => {
      withoutWarn(() => {
        console.log('container', container);
        unmount();
      });
    });
  });
});
