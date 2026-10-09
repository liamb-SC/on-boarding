// The order service. Right now it calls the email provider synchronously:
// checkout waits for the email, and fails if the email provider is down.
export function createOrderService({ emailService, queue }) {
  const orders = [];
  return {
    orders,

    // TODO: save the order, then publish an 'OrderPlaced' message on the queue
    // instead of emailing here. Return as soon as the order is saved.
    async placeOrder(order) {
      orders.push(order);
      await emailService.send(order.email, `Thanks for order ${order.id}!`);
      return { id: order.id, status: 'placed' };
    },

    // TODO: consume the queue and send the confirmation email for each
    // OrderPlaced message. Let failures throw, so the queue retries them.
    startWorkers() {},
  };
}
