import { Reducer, of, lift, combineReducers } from '../src/index'

const foo =  new Reducer(0, (state, action) => {
  return action.type === 'foo' ? state + 1 : state
})

const bar = new Reducer(0, (state, action) => {
  return action.type === 'bar' ? (action.value || 2) : state
})

const foobar = combineReducers({ foo, bar })

function simulate(r) {
  return actions => {
    let state = r.init
    const result = [ r.present(state) ]
    actions.forEach(action => {
      state = r._step(state, action)
      result.push(r.present(state))
    })
    return result
  }
}

function bisimulate (ra, rb) {
  return actions => {
    let sa = ra.init, sb = rb.init
    expect(ra.present(sa)).toEqual(rb.present(sb))
    actions.forEach(action => {
      sa = ra._step(sa, action)
      sb = rb._step(sb, action)
      expect(ra.present(sa)).toEqual(rb.present(sb))
    })
  }
}

const actions = [
  { type: 'foo' },
  { type: 'bar' },
  { type: 'bar' }
]

const duplicate = w => w.extend(x => x)

describe('The laws of Fantasy Land', () => {

  it('follows the functor unit law', () => {
    bisimulate(
      foobar,
      foobar.map(x => x)
    )(actions)
  })

  it('follows the functor composition law', () => {
    bisimulate(
      foobar.map(x => x + 1).map(x => x.toString()),
      foobar.map(x => (x + 1).toString())
    )(actions)
  })

  it('follows the contravarient functor unit law', () => {
    bisimulate(
      foobar,
      foobar.contramap(x => x)
    )(actions)
  })

  it('follows the contravariant functor composition law', () => {
    bisimulate(
      foobar.contramap(x => ({ type: x })).contramap(x => x.prop),
      foobar.contramap(x => ({ type: x.prop }))
    )([ { prop: 'foo' }, { prop: 'bar' }, { prop: 'bar' }])
  })

  it('follows the comonad left unit law', () => {
    bisimulate(
      foobar,
      duplicate(foobar).extract()
    )(actions)
  })

  it('follows the applicative unit law', () => {
    bisimulate(
      foobar,
      foobar.ap(of(x => x))
    )(actions)
  })

  it('follows the applicative homomorphism law', () => {
    bisimulate(
      of(3).ap(of(x => x + 1)),
      of(4)
    )(actions)
  })

  it('follows the applicative interchange law', () => {
    bisimulate(
      of(3).ap(of(x => x + 1)),
      (of(x => x + 1)).ap(of(f => f(3)))
    )(actions)
  })

  it('follows the comonad right unit law', () => {
    bisimulate(
      foobar,
      duplicate(foobar).map(r => r.extract())
    )(actions)
  })

  it('follows the comonad associatitivy law', () => {
    bisimulate(
      duplicate(foobar).map(duplicate).extract().extract(),
      duplicate(duplicate(foobar)).extract().extract()
    )(actions)
  })

  it('provides "lift" as an alternative to .ap', () => {
    const enhance = lift((a, b) => ({ a, b }))
    const states = simulate(enhance(foo, bar))(actions)
    expect(states).toEqual([
      { a: 0, b: 0 },
      { a: 1, b: 0 },
      { a: 1, b: 2 },
      { a: 1, b: 2 },
    ])
    expect(states[2]).toBe(states[3])
  })

  it('can compose reducers as semigroupoids', () => {

    const r = foo
          .map(x => ({ type: 'bar', value: x }))
          .compose(bar)
          .map(x => ({ x }))

    const actions = [
      { type: 'foo' },
      { type: 'foo' },
      { type: 'foo' },
      { type: 'bar' }
    ]

    const result =
          simulate(r)(actions);

    expect(result).toEqual(
      [ {x: 0}, {x: 1}, {x: 2}, {x: 3}, {x: 3} ]
    )

    expect(result[3]).toBe(result[4])
  })

})
