
# React + Redux Mini Manual for CAMRIE App

This manual gives you a fast-track understanding of how React and Redux concepts are applied in the CAMRIE web application.

---

## ⚛️ React Basics

React is a component-based library. Each component manages part of the UI.

```tsx
function MyComponent() {
  return <div>Hello World</div>;
}
```

### Key Concepts:
- **JSX**: HTML-like syntax in JavaScript.
- **Props**: Data passed from parent to child component.
- **State**: Local data handled within a component (`useState`).
- **Hooks**: Functions like `useState`, `useEffect`, and Redux-specific ones (`useDispatch`, `useSelector`).

---

## 🧠 Redux Basics

Redux is a **state container** that holds app-wide data and provides a structured way to update it.

### 🔁 Data Flow

1. Component **dispatches** an action
2. **Thunk** (async logic) runs if needed
3. **Slice reducer** updates the store
4. Components **subscribe** and re-render with new data

---

## 🧩 Slices

Defined using `createSlice` from Redux Toolkit.

```ts
const authSlice = createSlice({
  name: 'auth',
  initialState: { token: null, status: 'idle' },
  reducers: {
    logout: (state) => { state.token = null; }
  },
  extraReducers: (builder) => {
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.token = action.payload;
    });
  }
});
```

- **Reducers**: Direct logic to update state
- **ExtraReducers**: Handle async `createAsyncThunk` actions

---

## 🚀 Actions + Thunks

**Thunks** are async actions for API calls.

```ts
export const loginThunk = createAsyncThunk('auth/login', async (credentials) => {
  const response = await fetch('/login', { method: 'POST', body: JSON.stringify(credentials) });
  return (await response.json()).token;
});
```

- Use `createAsyncThunk`
- Dispatch them from components using `dispatch(loginThunk(...))`

---

## 🎛 Dispatch and useSelector

```tsx
const dispatch = useDispatch();
const token = useSelector((state) => state.auth.token);

useEffect(() => {
  dispatch(fetchData());
}, []);
```

- **dispatch** sends an action
- **useSelector** reads from store

---

## 🌐 Routing (Tab-based)

Routing is controlled in `App.tsx` using a `TabContext`. When a tab is selected:
```tsx
<TabPanel value="home"><HomeTab /></TabPanel>
<TabPanel value="setup"><JobForm /></TabPanel>
<TabPanel value="results"><ResultsTab /></TabPanel>
```

Each tab is a self-contained component, which can use Redux state/actions.

---

## 🔄 State Synchronization

Redux keeps everything in sync:

- `dataSlice` → data from API
- `jobsSlice` → submitted jobs and statuses
- `authSlice` → login/logout and token
- Store is initialized in `store.ts` and injected via `<Provider>` in `main.tsx`

---

## Summary Mapping

| React Concept    | Redux Equivalent        |
|------------------|-------------------------|
| Component State  | Slice State             |
| useState         | createSlice              |
| Callback/Event   | dispatch(action)         |
| Props            | useSelector              |
| API Fetch        | createAsyncThunk         |

---

With this, you should be able to navigate and understand how data flows in the CAMRIE app.
