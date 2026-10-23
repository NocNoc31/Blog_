import { authClient } from '../lib/auth-client';

type AuthError = { code?: string; message?: string; status?: number };

const messages: Record<string, string> = {
  INVALID_PASSWORD: 'Mật khẩu hiện tại chưa đúng.',
  INVALID_EMAIL_OR_PASSWORD: 'Mật khẩu hiện tại chưa đúng.',
  PASSWORD_TOO_SHORT: 'Mật khẩu cần ít nhất 8 ký tự.',
  TOO_MANY_REQUESTS: 'Bạn thao tác hơi nhanh. Chờ một phút rồi thử lại nhé.',
};

const getErrorMessage = (error: AuthError | null) =>
  (error && error.status === 429 && messages.TOO_MANY_REQUESTS) ||
  (error?.code && messages[error.code]) ||
  error?.message ||
  'Có lỗi xảy ra. Bạn thử lại giúp mình nhé.';

const show = (element: HTMLElement | null, message: string, type: 'alert' | 'success') => {
  if (!element) return;
  if (type === 'alert') element.textContent = message;
  element.dataset.visible = 'true';
};

const hide = (element: HTMLElement | null) => {
  if (element) element.dataset.visible = 'false';
};

const setBusy = (button: HTMLButtonElement | null, busy: boolean) => {
  const label = button?.querySelector<HTMLElement>('[data-label]');
  if (!button || !label) return;
  button.disabled = busy;
  label.textContent = busy ? 'Đang xử lý…' : label.dataset.idle || 'Lưu';
};

document.querySelectorAll<HTMLButtonElement>('[data-label]').forEach((label) => {
  const text = label.closest('button');
  if (text) label.dataset.idle = label.textContent || 'Lưu';
});

const passwordForm = document.querySelector<HTMLFormElement>('[data-security-form="password"]');
if (passwordForm) {
  const alert = passwordForm.querySelector<HTMLElement>('[data-security-alert]');
  const success = passwordForm.querySelector<HTMLElement>('[data-security-success]');
  const submit = passwordForm.querySelector<HTMLButtonElement>('button[type="submit"]');

  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    hide(alert);
    hide(success);

    const data = new FormData(passwordForm);
    const currentPassword = String(data.get('currentPassword') || '');
    const newPassword = String(data.get('newPassword') || '');
    const confirmPassword = String(data.get('confirmPassword') || '');

    if (newPassword.length < 8) {
      show(alert, messages.PASSWORD_TOO_SHORT, 'alert');
      return;
    }

    if (newPassword !== confirmPassword) {
      show(alert, 'Hai lần nhập mật khẩu mới chưa khớp nhau.', 'alert');
      return;
    }

    setBusy(submit, true);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setBusy(submit, false);

    if (error) {
      show(alert, getErrorMessage(error), 'alert');
      return;
    }

    passwordForm.reset();
    show(success, 'Mật khẩu đã được cập nhật. Các phiên đăng nhập khác đã được đăng xuất.', 'success');
  });
}

const verifyButton = document.querySelector<HTMLButtonElement>('[data-verify-email]');
if (verifyButton) {
  const alert = document.querySelector<HTMLElement>('[data-verify-alert]');
  const success = document.querySelector<HTMLElement>('[data-verify-success]');
  const email = verifyButton.dataset.email;

  verifyButton.addEventListener('click', async () => {
    hide(alert);
    hide(success);
    setBusy(verifyButton, true);

    const { error } = await authClient.sendVerificationEmail({
      email: email || '',
      callbackURL: `${window.location.origin}/xac-thuc-email`,
    });

    setBusy(verifyButton, false);
    if (error) {
      show(alert, getErrorMessage(error), 'alert');
      return;
    }
    show(success, 'Đã gửi liên kết xác thực. Bạn kiểm tra hộp thư nhé.', 'success');
  });
}

const savedList = document.querySelector<HTMLElement>('[data-saved-list]');
if (savedList) {
  const countLabel = savedList.querySelector<HTMLElement>('[data-saved-count]');
  const empty = savedList.querySelector<HTMLElement>('[data-saved-empty]');
  const updateCount = () => {
    const remaining = savedList.querySelectorAll('[data-saved-item]').length;
    if (countLabel) countLabel.textContent = `${remaining} bài đã lưu.`;
    if (empty) empty.hidden = remaining > 0;
  };

  savedList.querySelectorAll<HTMLButtonElement>('[data-saved-remove]').forEach((button) => {
    button.addEventListener('click', async () => {
      const item = button.closest<HTMLElement>('[data-saved-item]');
      const postSlug = item?.dataset.postSlug;
      if (!item || !postSlug) return;

      button.disabled = true;
      const response = await fetch('/api/saved-posts', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postSlug }),
      });
      button.disabled = false;

      if (!response.ok) return;
      item.remove();
      updateCount();
    });
  });
}
