import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import logoSvg from '@/assets/logo.svg'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await signUp(email, password, {
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      })
      toast.success('Account created! Check your email to verify or sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      {/* Background Aurora Accent */}
      <div className="fixed top-0 right-0 w-96 h-96 aurora-gradient rounded-full opacity-10 blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 aurora-gradient rounded-full opacity-10 blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 p-2 bg-white shadow-lg shadow-indigo-950/10 border border-slate-100">
            <img src={logoSvg} alt="Nomi Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h1>
          <p className="text-sm text-slate-500 mt-1">Start tracking your finances with Nomi</p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <Input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aldi Yasin"
                className="h-11 px-4 rounded-xl border-slate-200 bg-white text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 px-4 rounded-xl border-slate-200 bg-white text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="h-11 px-4 pr-11 rounded-xl border-slate-200 bg-white text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="h-11 px-4 rounded-xl border-slate-200 bg-white text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Create Account
            </Button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1A2C4C] font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
