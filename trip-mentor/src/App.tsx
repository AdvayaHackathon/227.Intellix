import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/index.css';

// Pages
import Home from './pages/Home';
import TripPlanner from './pages/TripPlanner';
import TravelMentor from './pages/TravelMentor';
import Login from './pages/Login';
import Register from './pages/Register';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <AnimatePresence mode="wait">
              <Switch>
                <Route exact path="/">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Home />
                  </motion.div>
                </Route>
                <Route path="/login">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Login />
                  </motion.div>
                </Route>
                <Route path="/register">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Register />
                  </motion.div>
                </Route>
                <ProtectedRoute path="/planner" component={TripPlanner} />
                <ProtectedRoute path="/mentor" component={TravelMentor} />
              </Switch>
            </AnimatePresence>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
