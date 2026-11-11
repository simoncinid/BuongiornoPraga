export type CartItem = {
  id: string;
  tourSlug: string;
  tourTitle: string;
  slotId: string;
  startsAt: string;
  adults: number;
  children: number;
  infants?: number;
  unitInfantCents?: number;
  unitAdultCents: number;
  unitChildCents: number;
  imageUrl?: string;
};

const CART_KEY = "ftp-cart";

function readRaw(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("ftp-cart-updated"));
}

export function getCartItems(): CartItem[] {
  return readRaw();
}

export function cartItemTotal(item: CartItem) {
  return item.adults * item.unitAdultCents + item.children * item.unitChildCents + (item.infants||0)*(item.unitInfantCents||0);
}

export function cartSubtotal(items: CartItem[] = readRaw()) {
  return items.reduce((sum, item) => sum + cartItemTotal(item), 0);
}

export function addToCart(item: Omit<CartItem, "id">) {
  const items = readRaw();
  const existing = items.find(
    (entry) => entry.tourSlug === item.tourSlug && entry.slotId === item.slotId
  );

  if (existing) {
    existing.adults = item.adults;
    existing.children = item.children;
    existing.infants = item.infants;
    existing.unitInfantCents = item.unitInfantCents;
    existing.startsAt = item.startsAt;
    existing.tourTitle = item.tourTitle;
    existing.unitAdultCents = item.unitAdultCents;
    existing.unitChildCents = item.unitChildCents;
    existing.imageUrl = item.imageUrl;
  } else {
    items.push({
      ...item,
      id: `${item.tourSlug}-${item.slotId}-${Date.now()}`
    });
  }

  writeRaw(items);
  return items;
}

export function removeFromCart(id: string) {
  const items = readRaw().filter((item) => item.id !== id);
  writeRaw(items);
  return items;
}

export function clearCart() {
  writeRaw([]);
}

export function cartCount() {
  return readRaw().length;
}
