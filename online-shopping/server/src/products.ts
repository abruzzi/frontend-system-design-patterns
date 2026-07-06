export type ProductSummary = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  priceCents: number;
  rating: number;
  accent: string;
  brief: string;
};

export type ProductDetail = ProductSummary & {
  description: string;
  highlights: string[];
  specs: Array<{
    label: string;
    value: string;
  }>;
  shippingNote: string;
  stockStatus: string;
};

const catalog: ProductDetail[] = [
  {
    id: "aurora-buds-pro",
    name: "Aurora Buds Pro",
    tagline: "Noise-cancelling earbuds built for commute-to-call days.",
    category: "Audio",
    priceCents: 24900,
    rating: 4.8,
    accent: "#38bdf8",
    brief: "Pocket-sized earbuds with fast pairing, clear mics, and a case that lasts all week.",
    description:
      "Aurora Buds Pro are the kind of everyday earbuds that make a caching demo feel polished: lightweight to browse, but rich enough in the detail view to justify a second request. They balance active noise cancellation, reliable calls, and a compact case that charges over USB-C.",
    highlights: ["Adaptive ANC", "6-mic voice isolation", "Wireless charging"],
    specs: [
      { label: "Battery", value: "8 hours + 24 in case" },
      { label: "Codec", value: "AAC / SBC" },
      { label: "Water resistance", value: "IPX4" },
      { label: "Weight", value: "5.2g per bud" }
    ],
    shippingNote: "Ships same day in metro areas when ordered before 2pm.",
    stockStatus: "In stock"
  },
  {
    id: "lumen-pad-air",
    name: "Lumen Pad Air",
    tagline: "A thin productivity tablet for sketches, notes, and casual browsing.",
    category: "Tablet",
    priceCents: 79900,
    rating: 4.6,
    accent: "#22c55e",
    brief: "Bright 11-inch tablet with stereo speakers, stylus support, and all-day battery life.",
    description:
      "Lumen Pad Air gives the detail route more room to breathe with storage, display, and accessory fields that simply do not belong on the list route. It is designed for note-taking, lightweight design work, and quiet couch-side browsing.",
    highlights: ["11-inch laminated display", "Stylus ready", "Desktop-style multitasking"],
    specs: [
      { label: "Display", value: "11-inch 120Hz IPS" },
      { label: "Storage", value: "256GB" },
      { label: "Connectivity", value: "Wi-Fi 6E" },
      { label: "Battery", value: "Up to 12 hours" }
    ],
    shippingNote: "Includes stylus bundle during this mock launch week.",
    stockStatus: "Low stock"
  },
  {
    id: "pulse-mini-speaker",
    name: "Pulse Mini Speaker",
    tagline: "Portable room-filling sound with a warm, low-profile design.",
    category: "Speaker",
    priceCents: 17900,
    rating: 4.5,
    accent: "#f97316",
    brief: "Compact Bluetooth speaker tuned for small spaces, with punchy bass and long battery life.",
    description:
      "Pulse Mini Speaker exists to make the product list feel approachable while the detail page adds the richer information shoppers expect before buying. In a caching video, it also gives you an easy example of a route that gets revisited after the first view.",
    highlights: ["360-degree sound", "Fast USB-C charging", "Stereo pair mode"],
    specs: [
      { label: "Battery", value: "14 hours" },
      { label: "Input", value: "Bluetooth 5.4 / USB-C" },
      { label: "Drivers", value: "Dual 48mm" },
      { label: "Durability", value: "IP67 dust and water" }
    ],
    shippingNote: "Regional delivery only because of battery transport rules.",
    stockStatus: "In stock"
  },
  {
    id: "arc-dock-station",
    name: "Arc Dock Station",
    tagline: "A minimal desktop hub that keeps cables hidden and screens connected.",
    category: "Desk setup",
    priceCents: 32900,
    rating: 4.7,
    accent: "#a78bfa",
    brief: "Single-cable dock with dual-display support, power delivery, and a tidy aluminum stand.",
    description:
      "Arc Dock Station gives the backend a slightly more premium product with plenty of detail-only fields. It is useful in the demo because shoppers often bounce between the list and the same product detail page several times, which makes the cache win easy to explain.",
    highlights: ["Dual 4K output", "96W pass-through charging", "Vertical laptop stand"],
    specs: [
      { label: "Ports", value: "2x USB-C, 3x USB-A, HDMI, Ethernet" },
      { label: "Video", value: "Dual 4K at 60Hz" },
      { label: "Material", value: "CNC aluminum" },
      { label: "Power", value: "96W host charging" }
    ],
    shippingNote: "Eligible for free express shipping in this demo store.",
    stockStatus: "In stock"
  },
  {
    id: "halo-cam-lite",
    name: "Halo Cam Lite",
    tagline: "A tiny desk camera that keeps remote meetings sharp without fuss.",
    category: "Video",
    priceCents: 13900,
    rating: 4.4,
    accent: "#f43f5e",
    brief: "1080p webcam with automatic framing, soft low-light tuning, and a privacy shutter.",
    description:
      "Halo Cam Lite rounds out the catalog with a lower-priced product that still benefits from a richer detail payload. The detail view adds shipping and spec fields that can be cached after the first visit while the user moves around the router.",
    highlights: ["Auto framing", "Dual noise-reduction mics", "Magnetic privacy cover"],
    specs: [
      { label: "Resolution", value: "1080p at 60fps" },
      { label: "Mount", value: "Monitor clip / tripod thread" },
      { label: "Connection", value: "USB-C to USB-A cable included" },
      { label: "Field of view", value: "88 degrees" }
    ],
    shippingNote: "Pickup available from the mock flagship warehouse.",
    stockStatus: "Preorder"
  },
  {
    id: "nebula-keyboard",
    name: "Nebula Keyboard",
    tagline: "A low-profile mechanical keyboard with a calm sound signature.",
    category: "Input",
    priceCents: 21900,
    rating: 4.9,
    accent: "#eab308",
    brief: "Wireless mechanical keyboard with tactile switches, hot-swap sockets, and soft underglow.",
    description:
      "Nebula Keyboard leans into the premium desktop vibe of the store while staying simple enough for a teaching demo. It gives the detail route richer content and a believable reason for users to go back and forth between browsing and reading specs.",
    highlights: ["Hot-swappable switches", "Tri-mode wireless", "Per-key underglow"],
    specs: [
      { label: "Layout", value: "75% ANSI" },
      { label: "Battery", value: "4,000mAh" },
      { label: "Connectivity", value: "Bluetooth / 2.4GHz / USB-C" },
      { label: "Case", value: "Gasket-mounted aluminum" }
    ],
    shippingNote: "Limited first batch, so restocks may slip by a few days.",
    stockStatus: "Low stock"
  }
];

export function listProducts(): ProductSummary[] {
  return catalog.map(({ description, highlights, specs, shippingNote, stockStatus, ...summary }) => summary);
}

export function findProduct(productId: string): ProductDetail | undefined {
  return catalog.find((product) => product.id === productId);
}
