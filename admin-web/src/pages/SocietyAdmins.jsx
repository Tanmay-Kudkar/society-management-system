import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Users from './Users'

export default function SocietyAdmins() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('role') !== 'SOCIETY_ADMIN') {
      params.set('role', 'SOCIETY_ADMIN')
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
    }
  }, [location.pathname, location.search, navigate])

  return <Users />
}
