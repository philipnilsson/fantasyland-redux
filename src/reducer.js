const id = x => x;

function memo1(f) {
  let lastInput = {};
  let lastOutput;
  return function memoizedPresenter(input) {
    if (input === lastInput) {
      return lastOutput;
    }
    lastInput = input;
    lastOutput = f(input);
    return lastOutput;
  }
}

export default class Reducer {

  constructor(init, update = (s, a) => s, present = id) {
    this.init = init;
    this.update = update;
    this.present = memo1(present);
  }

  _step(state, event) {
    return this.update(state, event);
  }

  step(state, event) {
    return this.present(
      this._step(state, event)
    );
  }

  map(f) {
    return new Reducer(this.init, this.update, x => f(this.present(x)));
  }

  static of(x) {
    return new Reducer(x);
  }

  extract() {
    return this.present(this.init);
  }
}
