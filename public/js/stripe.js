import axios from "axios";
import { showAlert } from "./alerts";

export const bookTour = async (tourId) => {
  try {
    var stripe = Stripe(
      "pk_test_51Jtad3Cwtn9e5snmkaRVv6iu3JIN8XWCLsmoeRsbS81kovOZ40wWUIzsI59EY3LPx7q8jWIlxN6g8RLPpz3QclPN009K3kkmfv"
    );
    // 1) GET CHECKOUT SESSION FROM API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // 2) CREATE CHECKOUT FORM AND CHANGE CREDIT CARD
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert("error", err);
  }
};
