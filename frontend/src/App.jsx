import { createBrowserRouter } from 'react-router';
// The RouterProvider of react-router/dom can apply a navigation at once (flushSync option)
import { RouterProvider } from 'react-router/dom';
import AuthProvider from './context/AuthProvider';
import { routes } from './routes';

const router = createBrowserRouter(routes);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
