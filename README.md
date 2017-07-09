Fantasyland-Redux
=================

Reducers with baked in support for efficient selectors.

```javascript
const nameReducer = personReducer.map(p => p.name)
```

Fantasyland-redux is a fork of Redux. If you're not familiar with it you
should read its [documentation](http://redux.js.org/).

This library is based on the observation that it is possible to add
state selectors to reducers while maintaining all the same operations
we're used to from Redux.

We add `map` and other operations from the
[fantasyland](https://github.com/fantasyland/fantasy-land) spec to
reducers, while remaining backwards compatible with `react-redux`,
`redux-thunk` and other middlewares, as well as with automatically
adapting Redux style reducers.

```javascript
import reducer from 'fantasyland-redux'

// Define a reducer.
const todosReducer = reducer([], (todos, { type, newTodo }) => {
  if (type === ADD_TODOS) {
    return [ newTodo, ...todos ]
  }
  return todos
})

// Define a "derived" reducer.
const todos = todosReducer.map(todos => ({
  todos: todos,
  numberOfTodos: todos.length
}))

// Derived reducers support the same API as regular reducers.
export default combineReducers({
  todos,
  someOtherReducer
})
```

Motivation
----------

What is considered good application state is a matter of perspective:

When writing components we might be happy if we had a translations
dictionary in our app state. We'd simply access it directly to look up
translations.

From the perspective of serializing application state to local
storage, this approach would not be so good. A translations dictionary is
heavily denormalized, and will be too heavy. It'd be much better to
store only a piece of state denoting the current `locale`.

Therefore we'll need to call some function, let's say
`getTranslations` to look up translations from a locale in
components. But this can become pretty repetitive. If we run into this
type of situation a lot it can become a real problem in our app.

Fantasyland-redux let's you square this particular circle

```javascript
import reducer from 'fantasyland-redux';

const localeReducer = reducer('en-US', (locale, { type, newLocale }) => {
  if (type === SET_LOCALE) {
    return newLocale;
  }
  return locale;
})

// Define a "derived" reducer.
const translationsReducer = localeReducer.map(
  locale => getTranslations(locale)
)
```

What's nice about the code above is that we manage to maintain the
concept of a reducer while allowing derived state. The implementation
of `fantasyland-redux` will make sure that the "backing" state is
separate from the "presentational" state. This means we can have a
convenient view of our app state for consumers such as components, but
when serializing to disk we maintain the tight, denormalized state
we're used to having in redux.

API
---

The API for fantasyland-redux tries to be backwards-compatible with
Redux in as many ways as possible. It can promote reducers written in
the Redux function style to reducers written using `reducer(...)`
automatically for easy migration. It is also compatible with
`react-redux` and `redux-thunk` (and in general with any middleware
that is included using `applyMiddleware`). Unfortunately this does not
include the chrome devtools at the moment.

`fantasyland-redux` is a fork of `redux 3.7.1`.

In addition, reducers have a operations from the fantasyland API.

`reducer`
--------

`reducer` defines a new reducer in the style of
`fantasyland-redux`. Reducers are defined in the same style as in
redux but with some minor syntactic differences.

```javascript
import { reducer } from 'fantasyland-redux'

const counter = reducer(0, (state, action) => {
  if (action === 'INCREMENT')
    return state + 1
  return state
})
```

If you are a redux user keep in mind that its not generally necessary
to change existing reducers in the redux style unless you want to
use the extended API such as `map` on them.

`map`
-----

Map creates a derived reducer by applying a provided a given function
to its output.

```javascript
  const nameReducer = personReducer.map(p => p.name)
```

`lift`
-----

`lift` is a higher order function that makes other functions "work on
reducers".

Let's say we'd like to expose an average value of a set of values
being accumulated

```javascript
import { lift, reducer } from 'fantasyland-redux'

const lengthReducer =
  reducer(0, (length, action) => {
    if (action.type === ADD_ELEMENT) {
      return length + 1
    }
    return length
  })

const sumReducer =
  reducer(0, (sum, action) => {
    if (action.type === ADD_ELEMENT) {
      return sum + action.value
    }
    return sum
  })

const average =
  (length, sum) => sum / length

const averageReducer =
  lift(average)(lengthReducer, sumReducer)
```

`lift` "lifts" the calculation of an average to work on reducers.

Here `averageReducer` exposes the average value of added
elements. This however needs to have the backing state of both the
`length` and `sum` of elements in order to be computed correctly. This
will be stored in the reducer state, while the view will contain only
the `average`.
