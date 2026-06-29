export const busPaymentCategories = [
  { value: "both", label: "Pickup & Dropping" },
  { value: "pickup_only", label: "Pickup Only" },
  { value: "dropoff_only", label: "Dropping Only" },
  { value: "discounted", label: "Discounted Student" },
];

export const formatBusPaymentCategory = (category = "") =>
  busPaymentCategories.find((option) => option.value === category)?.label ||
  "Pickup & Dropping";
