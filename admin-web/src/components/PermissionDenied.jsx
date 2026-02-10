import { ShieldOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PermissionDenied({ message = "You don't have permission to access this resource" }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <ShieldOff className="w-24 h-24 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Access Denied</h2>
      <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md">{message}</p>
      <button 
        onClick={() => navigate('/dashboard')}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  )
}
