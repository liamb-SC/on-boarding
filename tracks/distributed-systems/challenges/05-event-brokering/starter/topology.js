// Wire up the messaging topology for the shop.
export function buildTopology({ createQueue, createTopic, createEventBus }) {
  const queues = {
    billing: createQueue('billing'),
    shipping: createQueue('shipping'),
    fraudCheck: createQueue('fraud-check'),
    euAnalytics: createQueue('eu-analytics'),
  };

  // SNS: the order service publishes { message, attributes: { eventType } } here.
  const orderEvents = createTopic('order-events');
  // TODO 1: fan-out. Every message reaches BOTH billing and shipping.
  // TODO 2: shipping only cares about eventType 'OrderPlaced' (use a filterPolicy).

  // EventBridge: events look like { source, 'detail-type', detail: { orderId, total, country } }
  const bus = createEventBus('shop');
  // TODO 3: rule 'big-orders' -> fraudCheck, for source 'shop.orders',
  //         detail-type 'OrderPlaced', and detail.total >= 1000
  // TODO 4: rule 'eu-orders' -> euAnalytics, for source 'shop.orders' (any detail-type)
  //         and detail.country one of DE, FR, IE, NL

  return { orderEvents, bus, queues };
}
