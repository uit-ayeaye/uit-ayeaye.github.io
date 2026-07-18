// ─── GRAND LINE FIZZ — One Piece character drink lineup ────────────────────
// Each drink maps to a can label texture in /public/labels/<key>.webp
// Art is 1086 x 583-ish, wraps the can 360°.

export type DrinkKey =
  | "luffy"
  | "zoro"
  | "nami"
  | "sanji"
  | "chopper"
  | "ace"
  | "usopp"
  | "robin"
  | "franky"
  | "brook"
  | "jinbe"
  | "sabo"
  | "law"
  | "shanks";

export type Drink = {
  key: DrinkKey;
  character: string;
  name: string;
  tagline: string;
  flavorNotes: string;
  /** Deep background color used by the carousel while this can is selected */
  color: string;
  /** Canonical-ish One Piece bounty in Berries — shown as a "WANTED" badge */
  bounty: number;
};

export const DRINKS: Drink[] = [
  {
    key: "luffy",
    character: "Monkey D. Luffy",
    name: "Gum-Gum Burst",
    tagline: "Stretches your limits.",
    flavorNotes: "Tropical mango-pineapple punch with a smoked chili kick",
    color: "#8C0A13", // Luffy's vest red, deepened
    bounty: 3_000_000_000,
  },
  {
    key: "zoro",
    character: "Roronoa Zoro",
    name: "Three-Sword Slash",
    tagline: "Triple-bladed green.",
    flavorNotes: "Matcha, lime and a wasabi bite — three cuts, one sip",
    color: "#14471E", // haramaki green
    bounty: 1_111_000_000,
  },
  {
    key: "nami",
    character: "Nami",
    name: "Mikan Thunderbolt",
    tagline: "Citrus with a forecast of lightning.",
    flavorNotes: "Bellemère-orchard tangerine charged with electric ginger",
    color: "#8A4500", // mikan orange, deepened
    bounty: 366_000_000,
  },
  {
    key: "sanji",
    character: "Sanji",
    name: "Diable Jambe",
    tagline: "Served at a rolling boil.",
    flavorNotes: "Blood orange flambé, cracked black pepper heat finish",
    color: "#122B47", // midnight-blue suit
    bounty: 1_032_000_000,
  },
  {
    key: "chopper",
    character: "Tony Tony Chopper",
    name: "Sakura Rumble",
    tagline: "A blizzard of blossoms.",
    flavorNotes: "Cherry-blossom cotton candy cream soda, doctor approved",
    color: "#7C2650", // sakura pink, deepened
    bounty: 1_000, // the crew's "pet" — famously priced at a rounding error
  },
  {
    key: "ace",
    character: "Portgas D. Ace",
    name: "Fire Fist",
    tagline: "Flames you can swallow.",
    flavorNotes: "Smoked cinnamon cola that burns twice as bright",
    color: "#5C1602", // ember
    bounty: 550_000_000,
  },
  {
    key: "usopp",
    character: "Usopp",
    name: "Tabasco Star",
    tagline: "Sniper-certified courage.",
    flavorNotes: "Fiery tomato-tabasco fizz with a green pop-herb snap",
    color: "#574318", // deep sniper ochre
    bounty: 500_000_000,
  },
  {
    key: "robin",
    character: "Nico Robin",
    name: "Cien Fleur Cold Brew",
    tagline: "Blooms in the dark.",
    flavorNotes: "Midnight cold-brew coffee, cocoa-flower bitters and violet",
    color: "#2E1740", // devil-child violet
    bounty: 930_000_000,
  },
  {
    key: "franky",
    character: "Franky",
    name: "Coup de Cola",
    tagline: "SUPER, straight from the cooler.",
    flavorNotes: "Full-throttle vanilla cola, over-carbonated to cyborg spec",
    color: "#0C5566", // cyborg cyan
    bounty: 394_000_000,
  },
  {
    key: "brook",
    character: "Brook",
    name: "Soul King",
    tagline: "Yohohoho — chilled to the bone.",
    flavorNotes: "Black-tea cream soda, elderflower and a cool menthol hum",
    color: "#1B1636", // soul-king indigo
    bounty: 383_000_000,
  },
  {
    key: "jinbe",
    character: "Jinbe",
    name: "Fish-Man Karate",
    tagline: "Turns the tide in your favor.",
    flavorNotes: "Deep-sea yuzu and salted plum with a riptide of ginger",
    color: "#0A3A4E", // knight-of-the-sea blue
    bounty: 1_100_000_000,
  },
  {
    key: "sabo",
    character: "Sabo",
    name: "Dragon's Claw",
    tagline: "A brother's fire, rekindled.",
    flavorNotes: "Charred pineapple and habanero cola — Ace's ember, reborn",
    color: "#163A5F", // revolutionary steel-blue
    bounty: 602_000_000,
  },
  {
    key: "law",
    character: "Trafalgar Law",
    name: "Surgeon's ROOM",
    tagline: "Room. Shambles. Sip.",
    flavorNotes: "Icy blood-orange and elderflower, a clean scalpel-mint finish",
    color: "#14262E", // surgeon charcoal-teal
    bounty: 3_000_000_000,
  },
  {
    key: "shanks",
    character: "Shanks",
    name: "Conqueror's Toast",
    tagline: "One cup with a future king.",
    flavorNotes: "Barrel-aged cherry cola with a warm sake-pear glow",
    color: "#5A0E16", // red-haired wine crimson
    bounty: 4_048_900_000,
  },
];
