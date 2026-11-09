import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorPage from './pages/ErrorPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';

// Routes of the application, shared by App (browser router) and the tests (memory router)
export const routes = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      {
        element: <ProtectedRoute roles={['CUSTOMER', 'EMPLOYEE', 'ADMIN']} />,
        children: [{ path: 'profile', element: <ProfilePage /> }],
      },
      {
        element: <ProtectedRoute roles={['ADMIN']} />,
        children: [{ path: 'admin/users', element: <UsersPage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
