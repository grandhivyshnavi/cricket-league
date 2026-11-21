import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { Spinner } from '@/components/ui/states'
import { AdminLayout } from '@/features/admin/AdminLayout'
import { RequireAdmin } from '@/features/admin/RequireAdmin'
import AboutPage from '@/pages/AboutPage'
import HomePage from '@/pages/HomePage'
import NotFoundPage from '@/pages/NotFoundPage'
import RegisterPage from '@/pages/RegisterPage'
import SchedulePage from '@/pages/SchedulePage'
import StatsPage from '@/pages/StatsPage'
import TeamsPage from '@/pages/TeamsPage'

const AdminPage = lazy(() => import('@/pages/admin/AdminPage'))
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'))

const fallback = <Spinner className="min-h-[60vh]" />

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'teams', element: <TeamsPage /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'stats', element: <StatsPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'admin/login',
    element: (
      <Suspense fallback={fallback}>
        <AdminLoginPage />
      </Suspense>
    ),
  },
  {
    path: 'admin',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={fallback}>
            <AdminPage />
          </Suspense>
        ),
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
