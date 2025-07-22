// Pricing structure for monthly accounting (100-2750 transactions)
export const MONTHLY_PRICING = {
  100: 2079,
  200: 3124,
  300: 4057,
  400: 4866,
  500: 5686,
  750: 7180,
  1000: 8911,
  1250: 10764,
  1500: 12494,
  1750: 14348,
  2000: 16078,
  2250: 17943,
  2500: 19673,
  2750: 21415,
};

// Pricing structure for quarterly/yearly accounting (10-300 transactions)
export const QUARTERLY_YEARLY_PRICING = {
  10: { monthly: 354, quarterly: 850, yearly: 2549 },
  15: { monthly: 499, quarterly: 1198, yearly: 3593 },
  20: { monthly: 623, quarterly: 1497, yearly: 4491 },
  30: { monthly: 874, quarterly: 2098, yearly: 6293 },
  60: { monthly: 1497, quarterly: 3593, yearly: 10779 },
  100: { monthly: 2079, quarterly: 4990, yearly: 14969 },
  200: { monthly: 3124, quarterly: 7498, yearly: 22493 },
  300: { monthly: 4057, quarterly: 9737, yearly: 29211 },
}; 