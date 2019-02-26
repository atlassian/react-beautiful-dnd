// @flow
import * as keyCodes from '../../src/view/key-codes';
import { timings } from '../../src/animation';

beforeEach(() => {
  cy.visit('/iframe.html?selectedKind=board&selectedStory=simple');
});

it('should reorder lists', () => {
  // order: Jake, BMO
  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(0)
    .as('first')
    .should('have.text', 'Jake');
  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(3)
    .should('have.text', 'BMO');

  // reorder operation
  cy.get('@first')
    .focus()
    .trigger('keydown', { keyCode: keyCodes.space })
    .trigger('keydown', { keyCode: keyCodes.arrowRight, force: true })
    // finishing before the movement time is fine - but this looks nice
    .wait(timings.outOfTheWay * 1000)
    .trigger('keydown', { keyCode: keyCodes.space, force: true });

  // order now 2, 1
  // note: not using get aliases as they where returning incorrect results
  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(0)
    .should('have.text', 'BMO');

  // index of the drag handle has changed
  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(2)
    .should('have.text', 'Jake');
});
