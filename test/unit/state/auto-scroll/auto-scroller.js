// @flow

describe('auto scroller', () => {
  describe('fluid scrolling', () => {
    describe('on drag', () => {
      describe('window scrolling', () => {
        it('should not scroll the window if not within the threshold band', () => {

        });

        it('should not scroll the window if within the threshold area there is no available window scroll', () => {

        });

        it('should scroll the window if within the threshold area in any direction', () => {

        });

        it('should not scroll the window if there is no required scroll', () => {

        });

        describe('window scroll speed', () => {
          it('should have a greater scroll speed the closer the user moves to the max speed point', () => {

          });

          it('should have the max scroll speed once the max speed point is exceeded', () => {

          });
        });
      });

      describe('droppable scrolling', () => {

      });

      describe('window scrolling before droppable scrolling', () => {

      });
    });

    describe('on drag end', () => {
      it('should cancel any pending window scroll', () => {

      });

      it('should cancel any pending droppable scroll', () => {

      });
    });
  });

  describe('jump scrolling', () => {

  });
});
