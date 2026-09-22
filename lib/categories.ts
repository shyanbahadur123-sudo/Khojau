import type { Category } from "@/types/database";

// Static category catalogue (22 required). DB table `categories` should mirror this.
// No fake providers, ratings, or counts are stored here.
export const CATEGORIES: Category[] = [
  { id: "electrician", name: "Electrician", slug: "electrician", icon: "⚡", description: "Wiring, switches, lighting and electrical repair" },
  { id: "plumber", name: "Plumber", slug: "plumber", icon: "🔧", description: "Leaks, taps, drainage and sanitary work" },
  { id: "laptop-repair", name: "Laptop Repair", slug: "laptop-repair", icon: "💻", description: "Laptop service, upgrades and data recovery" },
  { id: "mobile-repair", name: "Mobile Repair", slug: "mobile-repair", icon: "📱", description: "Screen, battery and mobile servicing" },
  { id: "ac-repair", name: "AC Repair", slug: "ac-repair", icon: "❄️", description: "AC install, servicing and gas refill" },
  { id: "refrigerator-repair", name: "Refrigerator Repair", slug: "refrigerator-repair", icon: "🧊", description: "Fridge cooling and compressor repair" },
  { id: "washing-machine-repair", name: "Washing Machine Repair", slug: "washing-machine-repair", icon: "🌀", description: "Washer service and spare parts" },
  { id: "mechanic", name: "Mechanic", slug: "mechanic", icon: "🔩", description: "General mechanical repair help" },
  { id: "tutor", name: "Tutor", slug: "tutor", icon: "📚", description: "SEE, +2, bachelor and language tutors" },
  { id: "photographer", name: "Photographer", slug: "photographer", icon: "📷", description: "Events, portraits and product shoots" },
  { id: "cleaner", name: "Cleaner", slug: "cleaner", icon: "🧹", description: "Home and office deep cleaning" },
  { id: "painter", name: "Painter", slug: "painter", icon: "🎨", description: "House painting and wall putty" },
  { id: "mover", name: "Mover", slug: "mover", icon: "🚚", description: "House shifting and transport" },
  { id: "tailor", name: "Tailor", slug: "tailor", icon: "🧵", description: "Stitching, fitting and boutiques" },
  { id: "makeup-artist", name: "Makeup Artist", slug: "makeup-artist", icon: "💄", description: "Bridal and event makeup" },
  { id: "car-bike-service", name: "Car/Bike Service", slug: "car-bike-service", icon: "🏍️", description: "Servicing, wash and roadside help" },
  { id: "internet-technician", name: "Internet Technician", slug: "internet-technician", icon: "🌐", description: "Router, cabling and ISP support" },
  { id: "home-appliance-repair", name: "Home Appliance Repair", slug: "home-appliance-repair", icon: "🔌", description: "TV, microwave, fan and small appliances" },
  { id: "construction-worker", name: "Construction Worker", slug: "construction-worker", icon: "🏗️", description: "Mason, carpenter and labour help" },
  { id: "graphic-designer", name: "Graphic Designer", slug: "graphic-designer", icon: "🖌️", description: "Logos, banners and social media design" },
  { id: "video-editor", name: "Video Editor", slug: "video-editor", icon: "🎬", description: "Reels, wedding and YouTube editing" },
  { id: "other", name: "Other", slug: "other", icon: "➕", description: "Other local services" },
];

export const categoryBySlug = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug.toLowerCase());

export const POPULAR_SERVICES = [
  "electrician",
  "plumber",
  "laptop-repair",
  "mobile-repair",
  "tutor",
  "photographer",
  "cleaner",
  "mover",
];
