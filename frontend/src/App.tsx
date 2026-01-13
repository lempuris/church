import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useAuthStore } from '@/store/auth'

// Layouts
import { AdminLayout, PublicLayout } from '@/components/layouts'

// Auth Pages
import { Login, Register, ForgotPassword, ResetPassword } from '@/pages/auth'

// Public Pages
import { Home, About, Contact, Events, Sermons, PrayerWall, Testimonies } from '@/pages/public'

// Admin Pages
import {
  Dashboard,
  MemberList,
  MemberForm,
  MemberDetail,
  CellList,
  CellForm,
  CellDetail,
  EventList,
  EventForm,
  EventDetail,
  EventAttendance,
  AttendanceReports,
  UserList,
  SermonList,
  SermonForm,
  SermonDetail,
  SermonSeriesList,
  PrayerList,
  TestimonyList,
} from '@/pages/admin'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  const checkAuth = useAuthStore((state) => state.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/events" element={<Events />} />
        <Route path="/sermons" element={<Sermons />} />
        <Route path="/prayer-wall" element={<PrayerWall />} />
        <Route path="/testimonies" element={<Testimonies />} />
      </Route>

      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <AuthRedirect>
            <Login />
          </AuthRedirect>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRedirect>
            <Register />
          </AuthRedirect>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        {/* Members */}
        <Route path="members" element={<MemberList />} />
        <Route path="members/new" element={<MemberForm />} />
        <Route path="members/:id" element={<MemberDetail />} />
        <Route path="members/:id/edit" element={<MemberForm />} />
        {/* Cells */}
        <Route path="cells" element={<CellList />} />
        <Route path="cells/new" element={<CellForm />} />
        <Route path="cells/:id" element={<CellDetail />} />
        <Route path="cells/:id/edit" element={<CellForm />} />
        {/* Events */}
        <Route path="events" element={<EventList />} />
        <Route path="events/new" element={<EventForm />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="events/:id/edit" element={<EventForm />} />
        <Route path="events/:id/attendance" element={<EventAttendance />} />
        {/* Attendance Reports */}
        <Route path="attendance/reports" element={<AttendanceReports />} />
        {/* Sermons */}
        <Route path="sermons" element={<SermonList />} />
        <Route path="sermons/new" element={<SermonForm />} />
        <Route path="sermons/series" element={<SermonSeriesList />} />
        <Route path="sermons/:id" element={<SermonDetail />} />
        <Route path="sermons/:id/edit" element={<SermonForm />} />
        {/* Prayer Requests */}
        <Route path="prayer-requests" element={<PrayerList />} />
        {/* Testimonies */}
        <Route path="testimonies" element={<TestimonyList />} />
        {/* User Management (Admin Only) */}
        <Route path="users" element={<UserList />} />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
