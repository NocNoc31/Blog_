import { authClient } from '../lib/auth-client';

type AuthError = { code?: string; message?: string; status?: number };

const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Email hoặc mật khẩu chưa đúng. Bạn thử lại giúp mình nhé.',
  USER_ALREADY_EXISTS: 'Email này đã có tài khoản. Bạn thử đăng nhập hoặc đặt lại mật khẩu.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    'Email này đã có tài khoản. Bạn thử đăng nhập hoặc đặt lại mật khẩu.',
  PASSWORD_TOO_SHORT: 'Mật khẩu cần ít nhất 8 ký tự.',
  PASSWORD_TOO_LONG: 'Mật khẩu quá dài. Bạn dùng mật khẩu ngắn hơn giúp mình nhé.',
  INVALID_TOKEN: 'Liên kết đã hết hạn hoặc không còn hợp lệ. Bạn yêu cầu liên kết mới nhé.',
  EMAIL_NOT_VERIFIED: 'Bạn cần xác thực email trước khi đăng nhập.',
  TOO_MANY_REQUESTS: 'Bạn thao tác hơi nhanh. Chờ một phút rồi thử lại nhé.',
};

const getErrorMessage = (error: AuthError | null) => {
  if (!error) return 'Có lỗi xảy ra. Bạn thử lại giúp mình nhé.';
  if (error.status === 429) return messages.TOO_MANY_REQUESTS;
  return (error.code && messages[error.code]) || error.message || 'Có lỗi xảy ra. Bạn thử lại giúp mình nhé.';
};

const safeNext = (value: string | null) =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : '/tai-khoan';

const setAlert = (form: HTMLFormElement, message: string) => {
  const alert = form.querySelector<HTMLElement>('[data-auth-alert]');
  if (!alert) return;
  alert.textContent = message;
  alert.dataset.visible = 'true';
};

const clearAlert = (form: HTMLFormElement) => {
  const alert = form.querySelector<HTMLElement>('[data-auth-alert]');
  if (!alert) return;
  alert.textContent = '';
  alert.dataset.visible = 'false';
};

const setBusy = (form: HTMLFormElement, busy: boolean) => {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const label = button?.querySelector<HTMLElement>('[data-label]');
  if (!button || !label) return;
  button.disabled = busy;
  label.textContent = busy ? 'Đang xử lý…' : label.dataset.idle || 'Gửi';
};

const value = (form: HTMLFormElement, name: string) =>
  (form.elements.namedItem(name) as HTMLInputElement | null)?.value.trim() || '';

const nextFromUrl = () => safeNext(new URLSearchParams(window.location.search).get('next'));

const nextWithFlag = (flag: string) => {
  const target = new URL(nextFromUrl(), window.location.origin);
  target.searchParams.set(flag, '1');
  return `${target.pathname}${target.search}${target.hash}`;
};

const initLogin = (form: HTMLFormElement) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(form);
    const email = value(form, 'email');
    const password = value(form, 'password');

    if (!email || !password) {
      setAlert(form, 'Bạn điền email và mật khẩu giúp mình nhé.');
      return;
    }

    setBusy(form, true);
    const { error } = await authClient.signIn.email({
      email,
      password,
      rememberMe: Boolean((form.elements.namedItem('rememberMe') as HTMLInputElement | null)?.checked),
    });
    setBusy(form, false);

    if (error) return setAlert(form, getErrorMessage(error));
    window.location.assign(nextWithFlag('signed-in'));
  });
};

const initSignup = (form: HTMLFormElement) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(form);
    const name = value(form, 'name');
    const email = value(form, 'email');
    const password = value(form, 'password');
    const confirmPassword = value(form, 'confirmPassword');

    if (name.length < 2) return setAlert(form, 'Bạn cho mình biết tên hiển thị nhé.');
    if (!email) return setAlert(form, 'Bạn điền email giúp mình nhé.');
    if (password.length < 8) return setAlert(form, messages.PASSWORD_TOO_SHORT);
    if (password !== confirmPassword) return setAlert(form, 'Hai lần nhập mật khẩu chưa khớp nhau.');

    setBusy(form, true);
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: nextFromUrl(),
    });
    setBusy(form, false);

    if (error) return setAlert(form, getErrorMessage(error));
    window.location.assign(nextWithFlag('welcome'));
  });
};

const initForgot = (form: HTMLFormElement) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(form);
    const email = value(form, 'email');
    if (!email) return setAlert(form, 'Bạn điền email đã dùng để tạo tài khoản nhé.');

    setBusy(form, true);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/dat-lai-mat-khau`,
    });
    setBusy(form, false);

    if (error) return setAlert(form, getErrorMessage(error));
    form.querySelector<HTMLElement>('[data-auth-success]')?.setAttribute('data-visible', 'true');
    form.querySelectorAll<HTMLInputElement>('input').forEach((input) => (input.value = ''));
  });
};

const initReset = (form: HTMLFormElement) => {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const tokenInput = form.querySelector<HTMLInputElement>('input[name="token"]');
  if (tokenInput) tokenInput.value = token;

  if (!token) {
    setAlert(form, 'Liên kết không có mã đặt lại mật khẩu. Bạn yêu cầu một liên kết mới nhé.');
    form.querySelector<HTMLButtonElement>('button[type="submit"]')?.setAttribute('disabled', 'true');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(form);
    const password = value(form, 'password');
    const confirmPassword = value(form, 'confirmPassword');

    if (password.length < 8) return setAlert(form, messages.PASSWORD_TOO_SHORT);
    if (password !== confirmPassword) return setAlert(form, 'Hai lần nhập mật khẩu chưa khớp nhau.');

    setBusy(form, true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setBusy(form, false);

    if (error) return setAlert(form, getErrorMessage(error));
    form.querySelector<HTMLElement>('[data-auth-success]')?.setAttribute('data-visible', 'true');
    form.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach((input) => (input.value = ''));
  });
};

document.querySelectorAll<HTMLFormElement>('[data-auth-form]').forEach((form) => {
  const type = form.dataset.authForm;
  if (type === 'login') initLogin(form);
  if (type === 'signup') initSignup(form);
  if (type === 'forgot') initForgot(form);
  if (type === 'reset') initReset(form);

  const label = form.querySelector<HTMLElement>('button[type="submit"] [data-label]');
  if (label) label.dataset.idle = label.textContent || 'Gửi';
});
