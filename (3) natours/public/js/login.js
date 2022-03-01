/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: {
        email,
        password,
      },
      credentials: 'include',
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      console.log(res.data);
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (err) {
    // Alerting error message.

    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout',
    });
    // Reloading the page to send the fake invalid cookie to the server, server will reject it as a valid token so
    // the user won't be logged-in anymore.
    // location.reload(true) will force the browser to reload it from the server not from the local cache. (only for
    // firefox)
    if ((res.data.status = 'success')) location.reload(true);
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};
