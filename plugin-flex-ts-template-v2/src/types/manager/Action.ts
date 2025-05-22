import { Action as ReduxAction } from 'redux';

// Extend this payload to be of type that your ReduxAction is
// Normally you'd follow this pattern...https://redux.js.org/recipes/usage-with-typescript#a-practical-example
export default interface Action<P = any> extends ReduxAction {
  type: string;
  payload?: P;
}
