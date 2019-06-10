// @flow
import * as keyCodes from '../../src/view/key-codes';
import { timings } from '../../src/animation';

beforeEach(() => {
  cy.visit('/iframe.html?id=single-vertical-list--basic');
});

it('should reorder a list', () => {
  // order: 1, 2
  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(0)
    .as('first')
    .should('contain', 'id:1');
  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(1)
    .should('contain', 'id:2');

  // reorder operation
  cy.get('@first')
    .focus()
    .trigger('keydown', { keyCode: keyCodes.space })
    .trigger('keydown', { keyCode: keyCodes.arrowDown, force: true })
    // finishing before the movement time is fine - but this looks nice
    .wait(timings.outOfTheWay * 1000)
    .trigger('keydown', { keyCode: keyCodes.space, force: true });

  // order now 2, 1
  // note: not using get aliases as they where returning incorrect results
  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(0)
    .should('contain', 'id:2');

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(1)
    .should('contain', 'id:1');
});
