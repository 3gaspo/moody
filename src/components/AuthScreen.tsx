import { AuthForm } from './AuthForm';
import { AuthShell } from './AuthShell';
import { useAuth } from '../providers/Providers';
export function AuthScreen() {
  const { signIn, signUp, clearError } = useAuth();
  return <AuthShell appName="Moody" logo="/moody.svg"><AuthForm onAuthenticate={async (email, password, signUpMode) => { clearError(); return signUpMode ? signUp(email, password) : signIn(email, password); }} /></AuthShell>;
}
