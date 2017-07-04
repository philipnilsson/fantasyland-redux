import { ADD_TODO, DISPATCH_IN_MIDDLE, THROW_ERROR } from './actionTypes'
import Reducer from '../../src/reducer';

function id(state = []) {
  return state.reduce((result, item) => (
    item.id > result ? item.id : result
  ), 0) + 1
}

export const todos = new Reducer([], (state, action) => {
  switch (action.type) {
    case ADD_TODO:
      return [
        ...state,
        {
          id: id(state),
          text: action.text
        }
      ]
    default:
      return state
  }
});

export const todosReverse = new Reducer([], (state, action)  => {
  switch (action.type) {
    case ADD_TODO:
      return [
        {
          id: id(state),
          text: action.text
        }, ...state
      ]
    default:
      return state
  }
});

export const dispatchInTheMiddleOfReducer = new Reducer([], (state, action)  => {
  switch (action.type) {
    case DISPATCH_IN_MIDDLE:
      action.boundDispatchFn()
      return state
    default:
      return state
  }
});

export const errorThrowingReducer = new Reducer([], (state, action) => {
  switch (action.type) {
    case THROW_ERROR:
      throw new Error()
    default:
      return state
  }
});
