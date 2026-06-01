import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/login-page.css";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ username, email, password });
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível autenticar.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-card" aria-label="Formulario de login">
        <div className="login-card__brand">
          <img src="/logo.png" alt="Trippi" className="login-card__logo" />
        </div>

        <div className="login-card__tabs" role="tablist" aria-label="Acesso da conta">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={`login-card__tab${mode === "login" ? " is-active" : ""}`}
            onClick={() => setMode("login")}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={`login-card__tab${mode === "register" ? " is-active" : ""}`}
            onClick={() => setMode("register")}
          >
            Cadastrar
          </button>
        </div>

        <div className="login-card__header">
          <div>
            <h2>{mode === "login" ? "Login" : "Cadastro"}</h2>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="login-form__field">
              <span>User</span>
              <div className="login-form__input-wrapper">
                <User size={18} />
                <input
                  type="text"
                  name="username"
                  placeholder="seu_user"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </div>
            </label>
          )}

          <label className="login-form__field">
            <span>Email</span>
            <div className="login-form__input-wrapper">
              <Mail size={18} />
              <input
                type="email"
                name="email"
                placeholder="voce@trippi.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </label>

          <label className="login-form__field">
            <span>Senha</span>
            <div className="login-form__input-wrapper">
              <LockKeyhole size={18} />
              <input
                type="password"
                name="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </label>

          {error && <p className="login-form__error">{error}</p>}

          <button type="submit" className="login-form__submit" disabled={isSubmitting}>
            <span>
              {isSubmitting
                ? "Processando..."
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta"}
            </span>
          </button>
        </form>
      </section>
    </div>
  );
}