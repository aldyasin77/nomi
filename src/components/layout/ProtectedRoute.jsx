import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import SplashScreen from '../SplashScreen'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <SplashScreen isOverlay={false} duration={0} />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
