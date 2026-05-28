import { ShieldCheck, LockKeyhole, Mail, Save, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { MainLayout } from "../../layouts/MainLayout";
import { getCurrentUserProfile, updateCurrentUserProfile } from "../../mock/user";
import "../../styles/profile-page.css";

export function ProfilePage() {
  const storedProfile = getCurrentUserProfile();
  const [username, setUsername] = useState(storedProfile.username);
  const [email, setEmail] = useState(storedProfile.email);
  const [password, setPassword] = useState(storedProfile.password);
  const [confirmPassword, setConfirmPassword] = useState(storedProfile.password);
  const [message, setMessage] = useState("");
  const passwordsMatch = password === confirmPassword;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordsMatch) {
      setMessage("As senhas precisam ser iguais.");
      return;
    }

    updateCurrentUserProfile({ username, email, password });
    setMessage("Informações atualizadas com sucesso.");
  }

  return (
    <MainLayout>
      <div className="profile-page">
        <section className="profile-hero">
          <h1>Seu perfil</h1>
          <p>Visualize e edite suas informações de acesso.</p>
        </section>

        <div className="profile-grid">
          <aside className="profile-summary-card">
            <div className="profile-summary-card__avatar">
              <UserRound size={34} />
            </div>
            <strong>{username}</strong>
            <span>{email}</span>
            <div className="profile-summary-card__meta">
              <p>Senha</p>
              <strong>{"*".repeat(Math.max(password.length, 8))}</strong>
            </div>
          </aside>

          <section className="profile-form-card">
            <div className="profile-form-card__header">
              <h2>Editar Perfil</h2>
            </div>

            <form className="profile-form" onSubmit={handleSubmit}>
              <label className="profile-form__field">
                <span>User</span>
                <div className="profile-form__input-wrapper">
                  <UserRound size={18} />
                  <input value={username} onChange={(event) => setUsername(event.target.value)} required />
                </div>
              </label>

              <label className="profile-form__field">
                <span>Email</span>
                <div className="profile-form__input-wrapper">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </label>

              <div className="profile-form__row">
                <label className="profile-form__field">
                  <span>Senha</span>
                  <div className="profile-form__input-wrapper">
                    <LockKeyhole size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </div>
                </label>

                <label className="profile-form__field">
                  <span>Confirmar senha</span>
                  <div className="profile-form__input-wrapper">
                    <LockKeyhole size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                    />
                  </div>
                </label>
              </div>

              {message ? (
                <p className={`profile-form__message ${passwordsMatch ? "is-success" : "is-error"}`}>
                  {message}
                </p>
              ) : null}

              <button type="submit" className="profile-form__submit">
                <Save size={16} /> Salvar alterações
              </button>
            </form>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}