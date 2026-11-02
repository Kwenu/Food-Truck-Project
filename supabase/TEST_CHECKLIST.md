# Quick test checklist (do this once after setup)

Use three devices/windows: a phone (customer, not signed in), a computer on `/admin` (Manager account), and a tablet on `/kitchen` (Kitchen account).

1. **Customer:** open `/t/tbl-01` → add items → Checkout → choose Cash → **Place order**. The phone shows the order number, "Waiting for approval" and "Pay at the cashier".
2. **Admin:** the order appears immediately with a chime. The **kitchen does NOT show it yet.**
3. **Admin:** open the order → **Paid & approve**. Now the **kitchen** shows it under *To cook* with a chime; the customer's phone says *Approved*.
4. **Kitchen:** **Start preparing** → **Mark ready**. The ticket moves to *Ready* and says "Waiting for the waiter to collect". The customer's phone says *On its way to you*.
5. **Admin:** the order is *Ready* → tap **Served** → it is completed.
6. **Takeaway:** open `/` (cashier QR) → Takeaway → name + mobile → order → same flow; ticket shows "Takeaway" + name and the final button says **Collected**.
7. **Security:** in a private window (not signed in) open `/kitchen` and `/admin` → redirected to `/staff/login`.
8. **Roles:** a Kitchen user opening `/admin` gets "no access"; a Manager has no Settings / Staff access.
9. **Closed:** toggle "Accepting orders" off → customer checkout says the truck isn't taking orders.
10. **Sold out:** mark an item sold out → a customer with it in the cart gets a clear error at checkout.
