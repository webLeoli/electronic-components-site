'use client';

/**
 * RFQ Cart — Global state manager using React Context + localStorage
 * 
 * Allows users to add parts to a persistent "inquiry cart" from any page,
 * then view/edit/submit them all at once on the /rfq page.
 * 
 * Each cart item: { partNumber, manufacturer, qty, targetPrice, addedAt }
 */

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'fpgacenter_rfq_cart';
// Safety cap. Exported so feeders (BOM tool) can warn instead of silently
// dropping lines past the cap — ADD returns state unchanged when full.
export const MAX_CART_ITEMS = 50;
const MAX_ITEMS = MAX_CART_ITEMS;

// Identity key used by ADD-merge and REMOVE — one definition so the two can
// never disagree with each other or with UI "in cart" checks.
function itemKey(partNumber, manufacturer) {
  return `${String(partNumber || '').trim().toUpperCase()}::${String(manufacturer || '').trim().toUpperCase()}`;
}

// Actions
const ACTIONS = {
  INIT: 'INIT',
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  UPDATE: 'UPDATE',
  CLEAR: 'CLEAR',
  IMPORT_BULK: 'IMPORT_BULK',
};

function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.INIT:
      return { ...state, items: action.payload, initialized: true };

    case ACTIONS.ADD: {
      const { partNumber, manufacturer = '', qty = 1, targetPrice = '' } = action.payload;
      if (!partNumber) return state;
      
      // Check if already in cart
      const key = itemKey(partNumber, manufacturer);
      const exists = state.items.findIndex(
        item => itemKey(item.partNumber, item.manufacturer) === key
      );
      
      let newItems;
      if (exists >= 0) {
        // Update existing: add quantity
        newItems = [...state.items];
        const existing = newItems[exists];
        newItems[exists] = {
          ...existing,
          qty: Math.max(1, (parseInt(existing.qty) || 0) + (parseInt(qty) || 1)),
          manufacturer: manufacturer || existing.manufacturer,
          targetPrice: targetPrice || existing.targetPrice,
        };
      } else {
        if (state.items.length >= MAX_ITEMS) return state; // Cap
        newItems = [...state.items, {
          partNumber: partNumber.trim(),
          manufacturer: manufacturer.trim(),
          qty: parseInt(qty) || 1,
          targetPrice: targetPrice ? String(targetPrice) : '',
          addedAt: Date.now(),
        }];
      }
      return { ...state, items: newItems };
    }

    case ACTIONS.REMOVE: {
      if (typeof action.payload === 'object' && action.payload?.partNumber) {
        const key = itemKey(action.payload.partNumber, action.payload.manufacturer);
        return {
          ...state,
          items: state.items.filter(item => itemKey(item.partNumber, item.manufacturer) !== key),
        };
      }
      return {
        ...state,
        items: state.items.filter((_, i) => i !== action.payload),
      };
    }

    case ACTIONS.UPDATE: {
      const { index, field, value, partNumber, manufacturer } = action.payload;
      // Identity-addressed update (RFQ form lines don't share the cart's
      // ordering, so a row index there must never be used against this array).
      const at = partNumber !== undefined
        ? state.items.findIndex(item => itemKey(item.partNumber, item.manufacturer) === itemKey(partNumber, manufacturer))
        : index;
      if (at == null || at < 0 || !state.items[at]) return state;
      // Blanking the part number = removing the item. Keeping a row with an
      // empty PN would leave a ghost no identity-based call can address again.
      if (field === 'partNumber' && !String(value ?? '').trim()) {
        return { ...state, items: state.items.filter((_, i) => i !== at) };
      }
      const newItems = [...state.items];
      newItems[at] = { ...newItems[at], [field]: value };
      return { ...state, items: newItems };
    }

    case ACTIONS.CLEAR:
      return { ...state, items: [] };

    case ACTIONS.IMPORT_BULK: {
      // Import array of items (e.g., from BOM paste)
      const bulkItems = action.payload.slice(0, MAX_ITEMS).map(item => ({
        partNumber: (item.partNumber || '').trim(),
        manufacturer: (item.manufacturer || '').trim(),
        qty: parseInt(item.qty) || 1,
        targetPrice: item.targetPrice ? String(item.targetPrice) : '',
        addedAt: Date.now(),
      })).filter(item => item.partNumber);
      return { ...state, items: bulkItems };
    }

    default:
      return state;
  }
}

const RfqCartContext = createContext(null);

export function RfqCartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], initialized: false });
  const isFirstRender = useRef(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          dispatch({ type: ACTIONS.INIT, payload: parsed });
          return;
        }
      }
    } catch (e) {
      // Corrupted data — reset
      localStorage.removeItem(STORAGE_KEY);
    }
    dispatch({ type: ACTIONS.INIT, payload: [] });
  }, []);

  // Persist to localStorage on changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (state.initialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
      } catch (e) {
        // localStorage full — silent fail
      }
    }
  }, [state.items, state.initialized]);

  // Memoized actions
  const addItem = useCallback((partNumber, manufacturer, qty, targetPrice) => {
    dispatch({ type: ACTIONS.ADD, payload: { partNumber, manufacturer, qty, targetPrice } });
  }, []);

  const removeItem = useCallback((index) => {
    dispatch({ type: ACTIONS.REMOVE, payload: index });
  }, []);

  const updateItem = useCallback((index, field, value) => {
    dispatch({ type: ACTIONS.UPDATE, payload: { index, field, value } });
  }, []);

  // Update by identity — for callers (RFQ form) whose own row order differs
  // from the cart's.
  const updateItemByKey = useCallback((partNumber, manufacturer, field, value) => {
    dispatch({ type: ACTIONS.UPDATE, payload: { partNumber, manufacturer, field, value } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR });
  }, []);

  const importBulk = useCallback((items) => {
    dispatch({ type: ACTIONS.IMPORT_BULK, payload: items });
  }, []);

  const value = {
    items: state.items,
    count: state.items.length,
    initialized: state.initialized,
    addItem,
    removeItem,
    updateItem,
    updateItemByKey,
    clearCart,
    importBulk,
  };

  return (
    <RfqCartContext.Provider value={value}>
      {children}
    </RfqCartContext.Provider>
  );
}

export function useRfqCart() {
  const ctx = useContext(RfqCartContext);
  if (!ctx) throw new Error('useRfqCart must be used within RfqCartProvider');
  return ctx;
}
