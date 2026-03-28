interface Order {
  id: string;
  userId: string;
  total: number;
}

const orders: Order[] = [];

export async function findOrdersByUserId(userId: string): Promise<Order[]> {
  return orders.filter((o) => o.userId === userId);
}

export async function createOrder(order: Order): Promise<Order> {
  orders.push(order);
  return order;
}
