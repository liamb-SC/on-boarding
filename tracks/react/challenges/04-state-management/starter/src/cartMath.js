// Pure helpers both stores can share. A cart item is { id, name, price, qty }.
export const countItems = (items) => items.reduce((n, item) => n + item.qty, 0);
export const totalPrice = (items) => items.reduce((sum, item) => sum + item.price * item.qty, 0);
