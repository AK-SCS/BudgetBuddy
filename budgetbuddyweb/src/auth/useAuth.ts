import { useContext } from 'react';
import { AuthCtx } from './authContext';

export const useAuth = () => useContext(AuthCtx);
