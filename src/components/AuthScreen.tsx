import { AuthForm } from './AuthForm';
import { AuthShell } from './AuthShell';
import { useAuth } from '../providers/Providers';
export function AuthScreen() {
  const { signIn, signUp, resetPassword, clearError } = useAuth();
  return <AuthShell appName="Moody" logo="/moody.svg">
    <AuthForm onResetPassword={resetPassword} onAuthenticate={(email, password, signUpMode) => {
      clearError();
      return signUpMode ? signUp(email, password) : signIn(email, password);
    }} />
  </AuthShell>;
}
