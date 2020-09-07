import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

async function storeProducts(products: Product[]): Promise<void> {
  await AsyncStorage.setItem(
    '@goMarketPlace:products',
    JSON.stringify(products),
  );
}

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsJSON = await AsyncStorage.getItem(
        '@goMarketPlace:products',
      );

      if (productsJSON) {
        const storedProducts = JSON.parse(productsJSON);
        setProducts(storedProducts);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback((product: Product) => {
    product.quantity = 1;
    setProducts(prevProducts => {
      const productIndex = prevProducts.findIndex(
        prevProduct => prevProduct.id === product.id,
      );

      if (productIndex > -1) {
        const cloneProducts = [...prevProducts];
        cloneProducts[productIndex].quantity += 1;

        storeProducts(cloneProducts);
        return cloneProducts;
      }

      const addedProducts = [...prevProducts, product];

      storeProducts(addedProducts);
      return addedProducts;
    });
  }, []);

  const increment = useCallback((id: string) => {
    setProducts(prevProducts => {
      const productIndex = prevProducts.findIndex(product => product.id === id);

      const cloneProducts = [...prevProducts];
      cloneProducts[productIndex].quantity += 1;

      storeProducts(cloneProducts);
      return cloneProducts;
    });
  }, []);

  const decrement = useCallback((id: string) => {
    setProducts(prevProducts => {
      const productIndex = prevProducts.findIndex(product => product.id === id);

      const cloneProducts = [...prevProducts];
      cloneProducts[productIndex].quantity -= 1;

      if (cloneProducts[productIndex].quantity <= 0) {
        cloneProducts.splice(productIndex, 1);
      }

      storeProducts(cloneProducts);
      return cloneProducts;
    });
  }, []);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
