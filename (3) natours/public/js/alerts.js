/* eslint-disable */

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  // moving one level up and then removing child. (to delete the element itself)
  if (el) el.parentElement.removeChild(el);
};

// type is 'success' or 'error'
export const showAlert = (type, msg) => {
  // Hide any previous alert
  hideAlert();
  // CSS for this markup exist.
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  // Hide alert after 5s
  window.setTimeout(hideAlert, 5000);
};
