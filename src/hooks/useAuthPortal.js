// src/hooks/useAuthPortal.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAuthPortal(initialCountry = 'Colombia') {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [okMsg, setOkMsg] = useState('')
  const [country, setCountry] = useState(initialCountry)
  const [dealer, setDealer] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setOkMsg(`Sesión activa: ${data.user.email}`)
    })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg(''); setOkMsg(''); setLoading(true)
    const email = e.target.email.value.trim()
    const password = e.target.password.value
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setOkMsg('Inicio de sesión correcto')
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setErrorMsg(''); setOkMsg(''); setLoading(true)
    const email = e.target.regEmail.value.trim()
    const password = e.target.regPassword.value
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      const user = data.user
      if (!user) throw new Error('No se pudo crear el usuario')

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        email,
        country,
        dealer,
        role: 'dealer'
      })
      if (insertError) throw insertError

      setOkMsg('Cuenta creada. Revisa tu correo si la verificación está activada.')
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading, errorMsg, okMsg,
    country, setCountry,
    dealer, setDealer,
    handleLogin, handleRegister
  }
}
