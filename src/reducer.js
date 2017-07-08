import ActionTypes from './actionTypes'

const id = x => x

/**
 * Promotes a value into a reducer.
 */
export function promote(reducer) {
  if (reducer instanceof Reducer) {
    return reducer;
  }
  if (typeof reducer === 'function') {
    const init = reducer(undefined, ActionTypes.INIT);
    return new Reducer(init, reducer);
  }
  return Reducer.of(reducer);
}

/**
  * Memoizes a presenter function's last input in order
  * to make sure new objects are not producer unnecessarily
  */
function memo1(f) {
  let lastInput = {}
  let lastOutput
  return function memoizedPresenter(input) {
    if (input === lastInput) {
      return lastOutput
    }
    lastInput = input
    lastOutput = f(input)
    return lastOutput
  }
}

/**
 * A reducer consists of an initial state, an update function
 * and a presenter function
 */
export default class Reducer {

  constructor(init, update = id, present = id) {
    this.init = init
    this.update = update
    this.present = memo1(present)
  }

  map(f) {
    return new Reducer(
      this.init,
      this.update,
      this.present === id ? f : x => f(this.present(x))
    )
  }

  contramap(g) {
    return new Reducer(
      this.init,
      (state, action) => this.update(state, g(action)),
      this.present
    )
  }

  ap(r) {
    r = promote(r)
    return new Reducer(
      { x: this.init, f: r.init },
      (state, action) => {
        const { x, f } = state
        const next = {
          x: this.update(x, action),
          f: r.update(f, action)
        }
        return next.x === x && next.f === f ? state : next
      },
      ({ x, f }) => f(x)
    )
  }

  promap(f, g) {
    return this.map(f).contramap(g)
  }

  static of(x) {
    return new Reducer(x)
  }

  extract() {
    return this.present(this.init)
  }

  compose(r) {
    return new Reducer(
      { a: this.init, b: r.init },
      (state, action) => {
        const { a, b } = state
        const aNext = this.update(a, action)
        const bNext = r.update(b, this.present(aNext))
        return (a === aNext && b === bNext)
          ? state
          : { a: aNext, b: bNext }
      },
      ({ b }) => r.present(b)
    )
  }

  concat(r) {
    return this.compose(promote(r))
  }

  extend(f) {
    return new Reducer(
      this.init,
      this.update,
      state => f(new Reducer(state, this.update, this.present))
    )
  }
}

export const of = Reducer.of

/** Lifts a function that runs on "regular" arguments
  * to work on reducers.
  */
export const lift = f => (...reducers) => {
  reducers = reducers.map(promote)
  return new Reducer(
    reducers.map(r => r.init),
    (state, action) => {
      let newstate = []
      let hasChanged = false
      for (let i = 0; i < reducers.length; i++) {
        newstate.push(reducers[i].update(state[i], action))
        hasChanged = hasChanged || newstate[i] !== state[i]
      }
      return hasChanged ? newstate : state
    },
    args => {
      let presentations = []
      for (let i = 0; i < reducers.length; i++) {
        presentations.push(reducers[i].present(args[i]))
      }
      return f.apply(null, presentations)
    }
  )
}
