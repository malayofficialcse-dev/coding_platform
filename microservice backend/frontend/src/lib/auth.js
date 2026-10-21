import { createContext, useContext } from "react";

export const AuthContext = createContext({
  user: null,
  setUser: () => {},
  signOut: () => {},
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}
