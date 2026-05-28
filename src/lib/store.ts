import { create } from 'zustand';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  product_type?: string;
  gold_weight_14k?: number;
  diamond_weight_carat?: number;
  labour_charge?: number;
  gold_extra_charge?: number;
  diamond_extra_charge?: number;
  image_url: string;
  category: string;
  material: string;
  stock: number;
  featured: boolean;
  created_at: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

interface Store {
  cart: CartItem[];
  cartOpen: boolean;
  setCart: (items: CartItem[]) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  cartTotal: () => number;
  cartCount: () => number;
}

export const useStore = create<Store>((set, get) => ({
  cart: [],
  cartOpen: false,
  setCart: (items) => set({ cart: items }),
  addToCart: (item) => set((state) => {
    const existing = state.cart.find(i => i.product_id === item.product_id);
    if (existing) {
      return {
        cart: state.cart.map(i => 
          i.product_id === item.product_id 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      };
    }
    return { cart: [...state.cart, item] };
  }),
  removeFromCart: (id) => set((state) => ({
    cart: state.cart.filter(i => i.id !== id)
  })),
  updateQuantity: (id, quantity) => set((state) => ({
    cart: state.cart.map(i => i.id === id ? { ...i, quantity } : i)
  })),
  clearCart: () => set({ cart: [] }),
  toggleCart: () => set((state) => ({ cartOpen: !state.cartOpen })),
  cartTotal: () => get().cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  cartCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),
}));
