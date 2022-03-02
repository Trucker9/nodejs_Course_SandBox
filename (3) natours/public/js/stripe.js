/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

console.log(Stripe);
const stripe = Stripe(
  'pk_test_51KYhIfDBgjV3BMo6d5wATNC9VB1BVjY4uzEFZwGkE1Wr5cWSPF3J6FrWk25cYj11aXMcCOXKrQA14zon6R2S3yrB0084rmJ74Y'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      // axios created this session
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
