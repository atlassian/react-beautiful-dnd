// @flow

describe('dimension marshal', () => {
  describe('initial collection', () => {
    describe('invalid start state', () => {
      it('should cancel the collecting if already collecting', () => {

      });

      it('should cancel the collection if the draggable cannot be found', () => {

      });

      it('should cancel the collection if the home droppable cannot be found', () => {

      });
    });

    describe('pre drag start actions', () => {
      it('should publish the home droppable', () => {

      });

      it('should publish the dragging item', () => {

      });

      it('should ask the home droppable to start listening to scrolling', () => {

      });
    });

    describe('post drag start actions', () => {
      it('should not do anything if the drag was cancelled before the lift timeout finished', () => {

      });

      describe('in the first frame', () => {
        it('should not do anything if the drag was cancelled before the frame executed', () => {

        });

        it('should collect all of the droppable dimensions', () => {

        });

        it('should collect all of the draggable dimensions', () => {

        });

        it('should not collect any droppables that do not have the same type as the dragging item', () => {

        });

        it('should not collect any draggables that do not have the same type as the dragging item', () => {

        });

        it('should not collect the dragging dimension as it has already been collected', () => {

        });

        it('should not collect the home droppable dimension as it has already been collected', () => {

        });
      });

      describe('in the second frame', () => {
        it('should not do anything if the drag was cancelled before the frame executed', () => {

        });

        it('should publish all the collected droppable dimensions', () => {

        });

        it('should publish all the collected draggable dimensions', () => {

        });

        it('should request all the droppables to start listening to scroll events', () => {

        });
      });
    });
  });

  describe('registration change while not collecting', () => {
    describe('dimension added', () => {
      describe('droppable', () => {
        it('should log an error if there is already an entry with the same id', () => {

        });

        it('should be published in the next collection', () => {

        });
      });

      describe('draggable', () => {
        it('should log an error if there is already an entry with the same id', () => {

        });

        it('should be published in the next collection', () => {

        });
      });
    });

    describe('dimension removed', () => {
      describe('droppable', () => {
        it('should log an error if there is no entry with a matching id', () => {

        });

        it('should not collect the entry on the next collection', () => {

        });
      });

      describe('draggable', () => {
        it('should log an error if there is no entry with a matching id', () => {

        });

        it('should not collect the entry on the next collection', () => {

        });
      });
    });
  });

  describe('registration change while collecting', () => {
    describe('dimension added', () => {
      describe('draggable', () => {
        it('should log an error if the dimension already existed', () => {

        });

        it('should immediately publish the draggable', () => {

        });
      });

      describe('droppable', () => {
        it('should log an error if the dimension already existed', () => {

        });

        it('should immediately publish the droppable', () => {

        });

        it('should request the droppable publish scroll updates', () => {

        });
      });
    });

    describe('dimension removed', () => {

    });
  });
});
