import stripe from "stripe";

const stripeClient = new stripe(process.env.SECRET_KEY as string);

export default stripeClient;
