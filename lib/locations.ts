export interface LocationEntry {
  city: string;
  slug: string;
  areas: string[];
}

export const LOCATIONS: LocationEntry[] = [
  { city: "Kathmandu", slug: "kathmandu", areas: ["Baneshwor", "Putalisadak", "New Road", "Kalanki", "Chabahil", "Boudha", "Kirtipur", "Balaju"] },
  { city: "Lalitpur", slug: "lalitpur", areas: ["Pulchowk", "Jawalakhel", "Lagankhel", "Satdobato", "Godawari"] },
  { city: "Bhaktapur", slug: "bhaktapur", areas: ["Suryabinayak", "Thimi", "Kamalbinayak", "Duwakot"] },
  { city: "Pokhara", slug: "pokhara", areas: ["Lakeside", "Mahendrapul", "Bagar", "Chipledhunga"] },
  { city: "Chitwan", slug: "chitwan", areas: ["Bharatpur", "Narayangadh", "Tandi"] },
  { city: "Butwal", slug: "butwal", areas: ["Milanchowk", "Traffic Chowk"] },
  { city: "Dharan", slug: "dharan", areas: ["Bhanuchowk", "Chatara"] },
  { city: "Biratnagar", slug: "biratnagar", areas: ["Traffic Chowk", "Airport"] },
];

export const locationBySlug = (slug: string) =>
  LOCATIONS.find((l) => l.slug === slug.toLowerCase());

export const cityNames = () => LOCATIONS.map((l) => l.city);
