// Local Storage Helper Store for features missing Express route bindings.

export interface Address {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: any; // Product data from API
  variant?: any; // Selected variant data from API
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  verifiedBuyer: boolean;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  couponCode?: string;
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  statusHistory: { status: string; notes: string; createdAt: string }[];
}

const isServer = typeof window === "undefined";

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (isServer) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  if (isServer) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

export const placeholderStore = {
  // --- Address Management ---
  getAddresses: (): Address[] => {
    return getFromStorage<Address[]>("rr_addresses", []);
  },
  
  saveAddress: (address: Omit<Address, "id"> & { id?: string }): Address => {
    const addresses = placeholderStore.getAddresses();
    const id = address.id || `addr-${Math.random().toString(36).substr(2, 9)}`;
    const newAddress = { ...address, id } as Address;

    if (newAddress.isDefault) {
      addresses.forEach((addr) => (addr.isDefault = false));
    }

    const index = addresses.findIndex((addr) => addr.id === id);
    if (index >= 0) {
      addresses[index] = newAddress;
    } else {
      // If first address, make it default automatically
      if (addresses.length === 0) {
        newAddress.isDefault = true;
      }
      addresses.push(newAddress);
    }

    saveToStorage("rr_addresses", addresses);
    return newAddress;
  },

  deleteAddress: (id: string): void => {
    let addresses = placeholderStore.getAddresses();
    addresses = addresses.filter((addr) => addr.id !== id);
    if (addresses.length > 0 && !addresses.some((addr) => addr.isDefault)) {
      addresses[0].isDefault = true;
    }
    saveToStorage("rr_addresses", addresses);
  },

  // --- Cart Management ---
  getCart: (): CartItem[] => {
    return getFromStorage<CartItem[]>("rr_cart", []);
  },

  saveCart: (items: CartItem[]): void => {
    saveToStorage("rr_cart", items);
  },

  // --- Wishlist Management ---
  getWishlist: (): string[] => {
    return getFromStorage<string[]>("rr_wishlist", []);
  },

  toggleWishlist: (productId: string): boolean => {
    const list = placeholderStore.getWishlist();
    const index = list.indexOf(productId);
    let added = false;
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(productId);
      added = true;
    }
    saveToStorage("rr_wishlist", list);
    return added;
  },

  // --- Orders Management ---
  getOrders: (): Order[] => {
    return getFromStorage<Order[]>("rr_orders", []);
  },

  createOrder: (orderData: Omit<Order, "id" | "orderNumber" | "createdAt" | "statusHistory">): Order => {
    const orders = placeholderStore.getOrders();
    const orderNumber = `RR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const order: Order = {
      ...orderData,
      id: `ord-${Math.random().toString(36).substr(2, 9)}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      statusHistory: [
        {
          status: orderData.status,
          notes: "Order placed successfully.",
          createdAt: new Date().toISOString(),
        }
      ]
    };
    orders.unshift(order);
    saveToStorage("rr_orders", orders);
    // Clear cart after order
    saveToStorage("rr_cart", []);
    return order;
  },

  updateOrderPayment: (id: string, paymentId: string, status: "SUCCESS" | "FAILED"): Order | null => {
    const orders = placeholderStore.getOrders();
    const order = orders.find((o) => o.id === id);
    if (order) {
      order.paymentStatus = status === "SUCCESS" ? "SUCCESS" : "FAILED";
      order.status = status === "SUCCESS" ? "PAID" : "PENDING";
      order.statusHistory.push({
        status: order.status,
        notes: status === "SUCCESS" ? `Payment verified (Ref ID: ${paymentId})` : "Payment attempt failed",
        createdAt: new Date().toISOString(),
      });
      saveToStorage("rr_orders", orders);
      return order;
    }
    return null;
  },

  cancelOrder: (id: string): Order | null => {
    const orders = placeholderStore.getOrders();
    const order = orders.find((o) => o.id === id);
    if (order && order.status === "PENDING" || order?.status === "PAID" || order?.status === "PROCESSING") {
      order.status = "CANCELLED";
      order.statusHistory.push({
        status: "CANCELLED",
        notes: "Order cancelled by customer",
        createdAt: new Date().toISOString(),
      });
      saveToStorage("rr_orders", orders);
      return order;
    }
    return null;
  },

  // --- Reviews Management ---
  getReviews: (productId: string): Review[] => {
    const allReviews = getFromStorage<Record<string, Review[]>>("rr_reviews", {});
    return allReviews[productId] || [];
  },

  addReview: (productId: string, review: Omit<Review, "id" | "createdAt" | "verifiedBuyer">): Review => {
    const allReviews = getFromStorage<Record<string, Review[]>>("rr_reviews", {});
    const newReview: Review = {
      ...review,
      id: `rev-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      verifiedBuyer: true, // Auto-verified for B2C mock client flow
    };
    if (!allReviews[productId]) {
      allReviews[productId] = [];
    }
    allReviews[productId].unshift(newReview);
    saveToStorage("rr_reviews", allReviews);
    return newReview;
  },
};
