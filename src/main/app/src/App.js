import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

import './App.css';
import Admin from './Admin';
import User from './User';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/admin">
          <Admin />
        </Route>
        <Route path="/">
          <User />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
