import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AuthUsuario {
  id: string;
  nome: string;
  cargo: string;
}

interface AuthContextType {
  usuario: AuthUsuario | null;
  isAuthenticated: boolean;
  loginState: (token: string, usuario: AuthUsuario) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<AuthUsuario | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const nome = localStorage.getItem("usuario_nome");
    const id = localStorage.getItem("usuario_id");
    const cargo = localStorage.getItem("usuario_cargo");

    if (token && nome && id && cargo) {
      setUsuario({ id, nome, cargo });
      setIsAuthenticated(true);
    }
    
    setLoading(false);

    const handleUnauthorized = () => logout();
    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const loginState = (token: string, usr: AuthUsuario) => {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario_nome", usr.nome);
    localStorage.setItem("usuario_id", usr.id);
    localStorage.setItem("usuario_cargo", usr.cargo);
    
    setUsuario(usr);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_nome");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("usuario_cargo");
    setUsuario(null);
    setIsAuthenticated(false);
  };

  if (loading) return null; // Evita piscar rotas indevidas durante primeira leitura

  return (
    <AuthContext.Provider value={{ usuario, isAuthenticated, loginState, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
