// import React from 'react';
// import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './App.css';
import SidebarContext from './contexts/SidebarContext';
import { createBrowserRouter, RouterProvider} from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './components/Dashboard';
import ChatContext from './contexts/ChatContext';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';

// function ChatAreaWrapper() {
//   const { id } = useParams();
//   return <ChatArea key={id} />;
// }

function App() {
  const router = createBrowserRouter([
    {
      element: <Layout />,
      children: [{
        path: "/",
        element: <PrivateRoute><Dashboard /></PrivateRoute>
      },
      {
        path: "/chat/:id",
        element: <PrivateRoute><ChatArea /></PrivateRoute>
      },
      ],
    },
    { path: "/oauth/callback", element: <OAuthCallback /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> }
      
  ])
  return (
    <AuthProvider>
      <ChatContext>
        <SidebarContext>
        {/* <div className="app-container">
        <Sidebar />
        <ChatArea />
      </div> */}
        <RouterProvider router={router} />

        </SidebarContext>
      </ChatContext>
    </AuthProvider>
  );
}

export default App;
