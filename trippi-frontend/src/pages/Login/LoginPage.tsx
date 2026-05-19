import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, User } from "lucide-react";
import "../../styles/login-page.css";

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate("/dashboard");
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

          {mode === "login" && (
            <div className="login-form__meta">
              <label>
                <input type="checkbox" name="remember" />
                <span>Manter conectado</span>
              </label>

              <Link to="/dashboard">Entrar sem autenticar</Link>
            </div>
          )}

          <button type="submit" className="login-form__submit">
            <span>{mode === "login" ? "Entrar" : "Criar conta"}</span>
          </button>
        </form>
      </section>
    </div>
  );
}