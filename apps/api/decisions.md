### Decision: Delivery Fee Revenue Split

**Status:** Accepted

**Rule:** The delivery fee is divided between the company and the assigned driver. The driver receives 60% of the delivery fee, and the company retains 40%.

**Calculation:**
- `driver_delivery_earning = delivery_fee × 0.60`
- `company_delivery_share_amount = delivery_fee × 0.40`

**Scope:** This split applies only to the final delivery fee, including the applicable base fee and distance-based fee.

**Exclusions:** The split must not be calculated from the order's full total, food subtotal, company food fees, or restaurant service charges. These amounts follow their own financial rules.

**Historical records:** The rates and calculated amounts used for an order must be preserved so future pricing changes do not rewrite historical earnings.

**Implementation requirement:** Calculate and persist the driver and company shares using decimal-safe money arithmetic. Ensure the two shares add up to the delivery fee, subject to the system's currency precision and rounding rules.

**Business owner confirmation:** Confirm whether the 60/40 split is fixed for all delivery orders and whether any exceptions apply.