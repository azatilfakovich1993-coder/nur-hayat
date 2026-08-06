// Куда вести пользователя без активной сессии: на анонимный онбординг (в первый раз)
// или сразу на регистрацию/вход (уже видел онбординг раньше на этом устройстве).
// Используется и на сплэше, и после логаута — единая точка принятия решения.
export function nextAuthRoute(hasUser) {
  if (hasUser) return '/home'
  try {
    if (localStorage.getItem('onboarding_seen') === '1') return '/auth'
  } catch {}
  return '/onboarding'
}
