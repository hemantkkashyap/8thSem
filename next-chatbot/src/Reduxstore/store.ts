// store.ts
import { createStore } from 'redux';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import { AnyAction } from 'redux';
import { PersistPartial } from 'redux-persist/es/persistReducer';

// Types
export interface AppState {
  token: string | null;
}

const initialState: AppState = {
  token: null,
};

// Reducer
const rootReducer = (state = initialState, action: AnyAction): AppState => {
  switch (action.type) {
    case 'SET_TOKEN':
      return {
        ...state,
        token: action.payload,
      };
    case 'CLEAR_TOKEN':
      return {
        ...state,
        token: null,
      };
    default:
      return state;
  }
};

// Persist config
const persistConfig: PersistConfig<AppState> = {
  key: 'root',
  storage,
};

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store and persistor
export const store = createStore(persistedReducer);
export const persistor = persistStore(store);

// Root state with persistence
export type RootState = ReturnType<typeof store.getState>; // Includes PersistPartial
