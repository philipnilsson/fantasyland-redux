/* eslint-disable no-console */
import { combineReducers } from '../src'
import createStore, { ActionTypes } from '../src/createStore'
import Reducer from '../src/reducer';

describe('Utils', () => {
  describe('combineReducers', () => {
    it('returns a composite reducer that maps the state keys to given reducers', () => {
      const reducer = combineReducers({
        counter: new Reducer(
          0, (state, action) =>
            action.type === 'increment' ? state + 1 : state
        ),
        stack: new Reducer(
          [], (state, action) =>
            action.type === 'push' ? [ ...state, action.value ] : state
        )
      })

      const s1 = reducer.step(reducer.init, { type: 'increment' })
      expect(s1).toEqual({ counter: 1, stack: [] })
      const s2 = reducer.step(s1, { type: 'push', value: 'a' })
      expect(s2).toEqual({ counter: 1, stack: [ 'a' ] })
    })

    it('promotes all props which are not functions', () => {
      const reducer = combineReducers({
        fake: true,
        broken: 'string',
        another: { nested: 'object' },
        stack: new Reducer([], x => x)
      })

      const expected = {
        fake: true,
        broken: 'string',
        another: { nested: 'object' },
        stack: []
      };

      expect(
        reducer.init
      ).toEqual(expected);

      expect(
        reducer.step(reducer.init, { type: 'push' })
      ).toEqual(expected)
    })

    it('allows a symbol to be used as an action type', () => {
      const increment = Symbol('INCREMENT')

      const reducer = combineReducers({
        counter: new Reducer(0, (state, action) => {
          switch (action.type) {
            case increment:
              return state + 1
            default:
              return state
          }
        })
      })

      expect(reducer.step({ counter: 0 }, { type: increment }).counter).toEqual(1)
    })

    it('maintains referential equality if the reducers it is combining do', () => {
      const reducer = combineReducers({
        child1: new Reducer({}),
        child2: new Reducer({}),
        child3: new Reducer({})
      })
      const out = reducer.extract();
      expect(reducer.step(reducer.init, { type: 'FOO' })).toBe(out)
    })

    it('does not have referential equality if one of the reducers changes something', () => {
      const reducer = combineReducers({
        child1: new Reducer({}),
        child2: new Reducer({ count: 0 }, (state, action) => {
          switch (action.type) {
            case 'increment':
              return { count: state.count + 1 }
            default:
              return state
          }
        }),
        child3: new Reducer()
      })

      const out = reducer.extract();
      expect(reducer.step(reducer.init, { type: 'increment' })).not.toBe(out)
    })

    it('combines {} to Reducer.of({})', () => {
      const reducer = combineReducers({ })
      expect(reducer.step({ })).toEqual({ });

    })

    it('warns if input state does not match reducer shape', () => {
      const preSpy = console.error
      const spy = jest.fn()
      console.error = spy
      const reducer = combineReducers({
        foo: Reducer.of({ bar: 1 }),
        baz: Reducer.of({ qux: 3 })
      })

      const r1 = reducer.step()
      expect(spy.mock.calls.length).toBe(0)

      expect(r1).toEqual({
        foo: { bar: 1 },
        baz: { qux: 3 }
      })

      const r2 = reducer._step({ foo: { bar: 2 } })
      expect(spy.mock.calls.length).toBe(0)
      expect(r2).toEqual({
        foo: { bar: 2 },
        baz: { qux: 3 }
      })

      reducer.step({
        foo: { bar: 2 },
        baz: { qux: 4 }
      })

      createStore(reducer, { bar: 2 })
      expect(spy.mock.calls[0][0]).toMatch(
        /Unexpected key "bar".*createStore.*instead: "foo", "baz"/
      )

      createStore(reducer, { bar: 2, qux: 4, thud: 5 })
      expect(spy.mock.calls[1][0]).toMatch(
        /Unexpected keys "qux", "thud".*createStore.*instead: "foo", "baz"/
      )

      createStore(reducer, 1)
      expect(spy.mock.calls[2][0]).toMatch(
        /createStore has unexpected type of "Number".*keys: "foo", "baz"/
      )

      reducer.step({ corge: 2 })
      expect(spy.mock.calls[3][0]).toMatch(
        /Unexpected key "corge".*reducer.*instead: "foo", "baz"/
      )

      reducer.step({ fred: 2, grault: 4 })
      expect(spy.mock.calls[4][0]).toMatch(
        /Unexpected keys "fred", "grault".*reducer.*instead: "foo", "baz"/
      )

      reducer.step(1)
      expect(spy.mock.calls[5][0]).toMatch(
        /reducer has unexpected type of "Number".*keys: "foo", "baz"/
      )

      spy.mockClear()
      console.error = preSpy
    })

    it('only warns for unexpected keys once', () => {
      const preSpy = console.error
      const spy = jest.fn()
      console.error = spy

      const foo = new Reducer({ foo: 1 });
      const bar = new Reducer({ bar: 2 });

      expect(spy.mock.calls.length).toBe(0)
      const reducer = combineReducers({ foo, bar })
      const state = { foo: 1, bar: 2, qux: 3 }
      reducer.step(state, {})
      reducer.step(state, {})
      reducer.step(state, {})
      reducer.step(state, {})
      expect(spy.mock.calls.length).toBe(1)
      reducer.step({ ...state, baz: 5 }, {})
      reducer.step({ ...state, baz: 5 }, {})
      reducer.step({ ...state, baz: 5 }, {})
      reducer.step({ ...state, baz: 5 }, {})
      expect(spy.mock.calls.length).toBe(2)

      spy.mockClear()
      console.error = preSpy
    })
  })
})
