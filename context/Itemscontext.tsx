import React, { createContext, useContext, useState } from "react";

export type ItemType = "found" | "lost";

export interface Item {
  _id: number;
  id: string;
  type: ItemType;
  title: string;
  category: string;
  location: string;
  description: string;
  image: string;
  createdAt: number;
}

interface ItemContextType {
  items: Item[];
  addItem: (item: Item) => void;
}

const ItemContext = createContext<ItemContextType | undefined>(undefined);

export const ItemProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<Item[]>([]);

  const addItem = (item: Item) => {
    setItems((prev) => [item, ...prev]);
  };

  return (
    <ItemContext.Provider value={{ items, addItem }}>
      {children}
    </ItemContext.Provider>
  );
};

export const useItems = () => {
  const context = useContext(ItemContext);
  if (!context) throw new Error("useItems must be used inside ItemProvider");
  return context;
};