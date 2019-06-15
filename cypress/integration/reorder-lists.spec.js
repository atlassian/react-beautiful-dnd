// @flow
import * as keyCodes from '../../src/view/key-codes';
import { timings } from '../../src/animation';

it('should reorder lists', () => {
  cy.visit('/iframe.html?id=board--simple', {
    headers: {
      'Content-Security-Policy': "style-src 'self'",
    },
  });
  // order: Jake, BMO
  cy.get('h4')
    .eq(0)
    .as('first')
    .should('have.text', 'Jake');

  cy.get('h4')
    .eq(1)
    .should('have.text', 'BMO');

  // reorder operation
  cy.get('@first')
    .closest('[data-react-beautiful-dnd-drag-handle]')
    .focus()
    .trigger('keydown', { keyCode: keyCodes.space })
    .trigger('keydown', { keyCode: keyCodes.arrowRight, force: true })
    // finishing before the movement time is fine - but this looks nice
    .wait(timings.outOfTheWay * 1000)
    .trigger('keydown', { keyCode: keyCodes.space, force: true });

  // order now 2, 1
  // note: not using get aliases as they where returning incorrect results
  cy.get('h4')
    .eq(0)
    .should('have.text', 'BMO');

  // index of the drag handle has changed
  cy.get('h4')
    .eq(1)
    .should('have.text', 'Jake');
});
