export type DashboardOrderStatus =
  | "Designing"
  | "Ready for pickup"
  | "Out for delivery"
  | "Awaiting assignment";

export type DashboardOrder = {
  id: string;
  occasion: string;
  customer: string;
  designer: string;
  window: string;
  status: DashboardOrderStatus;
  components: string[];
  note: string;
};

export type CustomerPhoto = {
  title: string;
  detail: string;
};

export type DeliveryProofOption = {
  label: string;
  detail: string;
};

export const dashboardOrders: DashboardOrder[] = [
  {
    id: "10428",
    occasion: "Bright Birthday",
    customer: "Sarah Whitmore",
    designer: "Tasha",
    window: "Pickup 9:30 AM",
    status: "Ready for pickup",
    components: ["Bouquet", "Card", "Balloon"],
    note: "Customer asked for bright and spring-heavy colors.",
  },
  {
    id: "10434",
    occasion: "Sympathy Spray",
    customer: "Morrison Family",
    designer: "Eli",
    window: "Funeral 10:15 AM",
    status: "Out for delivery",
    components: ["Spray", "Ribbon"],
    note: "Deliver to funeral flower room.",
  },
  {
    id: "10441",
    occasion: "Designer's Choice",
    customer: "Adrian Keller",
    designer: "Unassigned",
    window: "Delivery 11:00 AM",
    status: "Awaiting assignment",
    components: ["Bouquet", "Teddy bear", "Chocolate box"],
    note: "Soft romantic palette, value should feel lush at $85.",
  },
];

export const customerPhotos: CustomerPhoto[] = [
  { title: "Two orders ago", detail: "Garden style arrangement with white hydrangea and pink roses." },
  { title: "Door delivery", detail: "Proof photo captured at side porch on February 28." },
  { title: "Anniversary roses", detail: "Classic dozen with upgraded vase and handwritten card." },
];

export const deliveryProofOptions: DeliveryProofOption[] = [
  { label: "Hand delivered", detail: "Recipient accepted delivery directly." },
  { label: "Left at door", detail: "Photo required before completion." },
  { label: "Funeral flower room", detail: "Log venue notes and drop location." },
  { label: "Hospital front desk", detail: "Capture staff name when possible." },
  { label: "Apartment front desk", detail: "Photo and notes required." },
  { label: "Other", detail: "Require notes before completion." },
];

export const quickSearch = [
  "order 10441",
  "sarah whitmore",
  "driver proof",
  "designer sales",
  "clock-in exceptions",
];
