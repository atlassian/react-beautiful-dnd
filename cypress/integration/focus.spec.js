// @flow
import * as keyCodes from '../../src/view/key-codes';
import { getHandleSelector, getDraggableSelector } from './util';

beforeEach(() => {
  cy.visit('/iframe.html?id=board--dragging-a-clone');
});

it('should not steal focus if not already focused when lifting', () => {
  // focusing on another handle
  cy.get(getHandleSelector('1')).focus();
  cy.focused().should('contain', 'id:1');

  cy.get(getHandleSelector('2'))
    .as('id:2')
    .trigger('mousedown', { button: 0 })
    .trigger('mousemove', {
      button: 0,
      clientX: 200,
      clientY: 300,
      force: true,
    });

  // asserting id:2 is now dragging
  cy.get(getHandleSelector('2')).should(
    'have.attr',
    'data-is-dragging',
    'true',
  );

  // focus not stolen
  cy.focused().should('contain', 'id:1');

  cy.get(getHandleSelector('2'))
    .trigger('mouseup', { force: true })
    // clone will be unmounting during drop
    .should('not.exist');

  // getting post clone handle
  cy.get(getHandleSelector('2')).should(
    'have.attr',
    'data-is-dragging',
    'false',
  );

  // focus not stolen
  cy.focused().should('contain', 'id:1');
});

it('should maintain focus if dragging a clone', () => {
  // focusing on another handle
  cy.get(getHandleSelector('2')).focus();
  cy.focused().should('contain', 'id:2');

  cy.get(getHandleSelector('2')).trigger('keydown', {
    keyCode: keyCodes.space,
  });

  // asserting id:2 is now dragging
  cy.get(getHandleSelector('2')).should(
    'have.attr',
    'data-is-dragging',
    'true',
  );

  // focus maintained
  cy.focused().should('contain', 'id:2');

  cy.get(getHandleSelector('2'))
    .trigger('keydown', { keyCode: keyCodes.arrowRight, force: true })
    .trigger('keydown', { keyCode: keyCodes.space, force: true })
    // clone will be unmounting during drop
    .should('not.exist');

  // getting post clone handle
  cy.get(getHandleSelector('2'))
    // no longer dragging
    .should('have.attr', 'data-is-dragging', 'false')
    // is in the second column (normally would loose focus moving between lists)
    .closest(getDraggableSelector('BMO'));

  // focus maintained
  cy.focused().should('contain', 'id:2');
});

it('should give focus to a combine target', () => {
  cy.visit('/iframe.html?id=board--with-combining-and-cloning');
  cy.get(getHandleSelector('2')).focus();
  cy.focused().should('contain', 'id:2');

  cy.get(getHandleSelector('2')).trigger('keydown', {
    keyCode: keyCodes.space,
  });

  // asserting id:2 is now dragging
  cy.get(getHandleSelector('2')).should(
    'have.attr',
    'data-is-dragging',
    'true',
  );

  // focus maintained
  cy.focused().should('contain', 'id:2');

  cy.get(getHandleSelector('2'))
    .trigger('keydown', { keyCode: keyCodes.arrowRight, force: true })
    // combining with item:1
    .trigger('keydown', { keyCode: keyCodes.arrowUp, force: true })
    // dropping
    .trigger('keydown', { keyCode: keyCodes.space, force: true })
    // clone will be unmounting during drop
    .should('not.exist');

  // focus giving to item:1 the combine target
  cy.focused().should('contain', 'id:1');
});

it('should not give focus to a combine target if source did not have focus at start of drag', () => {
  cy.visit('/iframe.html?id=board--with-combining-and-cloning');
  // focusing on something unrelated to the drag
  cy.get(getHandleSelector('3')).focus();

  cy.get(getHandleSelector('2')).trigger('keydown', {
    keyCode: keyCodes.space,
  });

  // asserting id:2 is now dragging
  cy.get(getHandleSelector('2')).should(
    'have.attr',
    'data-is-dragging',
    'true',
  );

  // focus not stolen
  cy.focused().should('contain', 'id:3');

  cy.get(getHandleSelector('2'))
    .trigger('keydown', { keyCode: keyCodes.arrowRight, force: true })
    // combining with item:1
    .trigger('keydown', { keyCode: keyCodes.arrowUp, force: true })
    // dropping
    .trigger('keydown', { keyCode: keyCodes.space, force: true })
    // clone will be unmounting during drop
    .should('not.exist');

  // focus not given to the combine target
  cy.focused().should('contain', 'id:3');
});
