/* eslint-disable */

// NOTE: index.js file is for getting information from the user and using other modules (other js files) to execute
// some actions. so we separate individual functionalities into separate files, then we retrieve data from user and
// preform some actions

// We just add polyfill to make our JS work in old browser.
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';

// DOM ELEMENTS
// const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');

// DELEGATION
// If page has mapBox element on it

// if (mapBox) {
//   const locations = JSON.parse(mapBox.dataset.locations);
//   displayMap(locations);
// }

// If page has login from  element on it
if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Values must be read after the submitting event has happened.
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log(`EMAIL: ${email} PASS: ${password}`);
    login(email, password);
  });

// Executing logout method when .......
if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Creating a form data object ot later be sent to the server (because we have multipart data)
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    // Array of selected files, and we select the first one.
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);

    updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    // This part will run after the promise of updating setting has finished (it's an async function!)
    document.querySelector('.btn--save-password').textContent = 'Save password';
    // Clearing password input fields.
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
