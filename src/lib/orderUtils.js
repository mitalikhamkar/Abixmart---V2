import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Creates one orders/{orderId} document with a Firestore-generated ID.
// Returns that ID so the caller can show it as an order reference.
export async function createOrder({ uid, customer, shippingAddress, items, subtotal, shipping, total, paymentMethod }) {
  const ref = await addDoc(collection(db, 'orders'), {
    uid,
    customer,
    shippingAddress,
    items,
    subtotal,
    shipping,
    total,
    paymentMethod,
    paymentStatus: 'pending',
    orderStatus: 'placed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}