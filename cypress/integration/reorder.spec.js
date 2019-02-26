// @flow
import * as keyCodes from '../../src/view/key-codes';
import { timings } from '../../src/animation';

beforeEach(() => {
  cy.visit(
    '/iframe.html?selectedKind=single%20vertical%20list&selectedStory=basic',
  );
});

it('should reorder a list', () => {
  // order: 1, 2
  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(0)
    .as('first')
    .should(el => {
      expect(el[0].innerText).to.have.string('id:1');
    });

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(1)
    .should(el => {
      expect(el[0].innerText).to.have.string('id:2');
    });

  // do drag
  cy.get('@first')
    .focus()
    .trigger('keydown', { keyCode: keyCodes.space })
    .trigger('keydown', { keyCode: keyCodes.arrowDown, force: true })
    // finishing before the movement time is fine - but this looks nice
    .wait(timings.outOfTheWay * 1000)
    .trigger('keydown', { keyCode: keyCodes.space, force: true });

  // order now 2, 1
  // note: not using aliases as they where returning incorrect results
  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(0)
    .should(el => {
      expect(el[0].innerText).to.have.string('id:2');
    });

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(1)
    .should(el => {
      expect(el[0].innerText).to.have.string('id:1');
    });
});
