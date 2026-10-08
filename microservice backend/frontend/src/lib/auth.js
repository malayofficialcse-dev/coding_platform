import { createContext, useContext } from "react";

export const AuthContext = createContext({
  user: null,
  setUser: () => {},
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
