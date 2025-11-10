import { createContext, useContext } from 'react';
import type { AuthContextType } from './authTypes';

export const AuthCtx = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthCtx);
