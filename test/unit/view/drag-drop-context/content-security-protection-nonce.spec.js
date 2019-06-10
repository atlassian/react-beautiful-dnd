// @flow
import React from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import uuidv4 from 'uuid/v4';
import DragDropContext from '../../../../src/view/drag-drop-context';
import { resetServerContext } from '../../../../src';
import * as attributes from '../../../../src/view/data-attributes';

it('should insert nonce into style tag', () => {
  const nonce = Buffer.from(uuidv4()).toString('base64');

  resetServerContext();
  const wrapper1: ReactWrapper<*> = mount(
    <DragDropContext nonce={nonce} onDragEnd={() => {}}>
      {null}
    </DragDropContext>,
  );
  const styleTag = document.querySelector(`[${attributes.prefix}-always="0"]`);
  const nonceAttribute = styleTag ? styleTag.getAttribute('nonce') : '';
  expect(nonceAttribute).toEqual(nonce);

  wrapper1.unmount();
});
