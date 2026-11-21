import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminSettingsPage from './pages/AdminSettingsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ErrorPage from './pages/ErrorPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProfilePage from './pages/ProfilePage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import UsersPage from './pages/UsersPage';

// Routes of the application, shared by App (browser router) and the tests (memory router)
export const routes = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order-confirmation', element: <OrderConfirmationPage /> },
      {
        element: <ProtectedRoute roles={['CUSTOMER', 'EMPLOYEE', 'ADMIN']} />,
        children: [
          { path: 'profile', element: <ProfilePage /> },
          { path: 'profile/settings', element: <ProfileSettingsPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
        ],
      },
      {
        element: <ProtectedRoute roles={['ADMIN']} />,
        children: [
          { path: 'admin/users', element: <UsersPage /> },
          { path: 'admin/settings', element: <AdminSettingsPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
