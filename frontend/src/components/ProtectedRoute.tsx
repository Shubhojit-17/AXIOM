import { Navigate, useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isConnected } = useWallet();
  const location = useLocation();

  if (!isConnected) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
