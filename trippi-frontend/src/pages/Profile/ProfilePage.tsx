import { LockKeyhole, Mail, Save, UserRound, Eye, EyeOff } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { MainLayout } from "../../layouts/MainLayout";
import { updateUserRequest } from "../../services/userService";
import "../../styles/profile-page.css";

export function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setUsername(user.username);
    setEmail(user.email);
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    setMessageType(null);
  }, [user]);

  const passwordsMatch = password === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setMessage("Sessao invalida. Faca login novamente.");
      setMessageType("error");
      return;
    }

    if (!passwordsMatch) {
      setMessage("As senhas precisam ser iguais.");
      setMessageType("error");
      return;
    }

    if (password && !password.trim()) {
      setMessage("A senha não pode conter apenas espaços.");
      setMessageType("error");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setMessageType(null);

      const payload: {
        username: string;
        email: string;
        password?: string;
      } = {
        username: username.trim(),
        email: email.trim(),
      };

      if (password.trim()) {
        payload.password = password;
      }

      await updateUserRequest(user.id, payload);
      await refreshUser();

      setPassword("");
      setConfirmPassword("");
      setMessage("Informacoes atualizadas com sucesso.");
      setMessageType("success");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil.",
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="profile-page">
          <section className="profile-form-card">
            <div className="profile-form-card__header">
              <h2>Carregando perfil...</h2>
            </div>
          </section>
        </div>
      </MainLayout>
    );
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
                  <span>Nova senha</span>
                  <div className="profile-form__input-wrapper">
                    <LockKeyhole size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="********"
                    />
                    <button
                      type="button"
                      className="login-form__password-toggle"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setShowPassword((previous) => !previous)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                <label className="profile-form__field">
                  <span>Confirmar nova senha</span>
                  <div className="profile-form__input-wrapper">
                    <LockKeyhole size={18} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="********"
                    />
                    <button
                      type="button"
                      className="login-form__password-toggle"
                      aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setShowConfirmPassword((previous) => !previous)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </div>

              {message ? (
                <p className={`profile-form__message ${messageType === "success" ? "is-success" : "is-error"}`}>
                  {message}
                </p>
              ) : null}

              <button type="submit" className="profile-form__submit" disabled={saving}>
                <Save size={16} /> {saving ? "Salvando..." : "Salvar alteracoes"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}