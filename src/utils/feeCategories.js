export const feeCategories = [
  { value: "new", label: "Newly Admitted" },
  { value: "returning", label: "Returning/Old" },
  { value: "vip", label: "VIP Student" },
  { value: "scholarship", label: "Scholarship Student" },
  { value: "discounted", label: "Discounted Student" },
  { value: "staff_child", label: "Staff Child" },
];

export const feeExemptCategories = ["vip", "scholarship"];

const legacyFeeCategoryLabels = {
  boarding: "Boarding Student (legacy)",
};

export const formatFeeCategory = (feeCategory = "") =>
  feeCategories.find((category) => category.value === feeCategory)?.label ||
  legacyFeeCategoryLabels[feeCategory] ||
  "Returning/Old";

export const isFeeExemptCategory = (feeCategory = "") =>
  feeExemptCategories.includes(feeCategory);

export const getDefaultFeeItems = (feeCategory = "returning") => {
  if (feeCategory === "new") {
    return [
      { name: "Admission Form", amount: "10000" },
      { name: "Registration Fee", amount: "59000" },
      { name: "School Uniforms", amount: "16000" },
      { name: "P.E Wear", amount: "6000" },
      { name: "Cardigan", amount: "5000" },
      { name: "Stockings & Tie", amount: "4000" },
      { name: "Books", amount: "35000" },
    ];
  }

  return [{ name: "School Fee", amount: "43000" }];
};

export const getFeeItemsKey = (feeCategory = "returning") =>
  `${feeCategory || "returning"}_items`;
