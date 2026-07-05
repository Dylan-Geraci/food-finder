"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

/**
 * Order flow state — any surface that shows a dish (home cards, quick
 * view menu, kitchen page) calls `requestOrder` with a snapshot of the
 * meal; the global OrderModal takes it from there.
 *
 * Role logic lives here so call sites stay dumb: guests are routed to
 * the auth modal, business accounts never see order affordances
 * (`canOrder`), and only diners reach the modal.
 */

export interface OrderTarget {
  mealId: string;
  title: string;
  price: number;
  image: string;
  servingsLeft: number;
  prepMinutes: number;
  kitchenName: string;
}

interface OrderContextValue {
  target: OrderTarget | null;
  /** Open the order modal for a meal (guests get the login modal instead). */
  requestOrder: (target: OrderTarget) => void;
  closeOrder: () => void;
  /** False for business accounts — hide order buttons entirely. */
  canOrder: boolean;
}

const OrderContext = createContext<OrderContextValue>({
  target: null,
  requestOrder: () => {},
  closeOrder: () => {},
  canOrder: true,
});

export function OrderProvider({ children }: { children: ReactNode }) {
  const { status, user, openAuth } = useAuth();
  const [target, setTarget] = useState<OrderTarget | null>(null);

  const canOrder = !(status === "authed" && user?.role === "cook");

  const requestOrder = useCallback(
    (t: OrderTarget) => {
      if (user?.role === "cook") return;
      if (status !== "authed") {
        openAuth("login");
        return;
      }
      setTarget(t);
    },
    [status, user, openAuth]
  );

  const closeOrder = useCallback(() => setTarget(null), []);

  return (
    <OrderContext.Provider value={{ target, requestOrder, closeOrder, canOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  return useContext(OrderContext);
}
