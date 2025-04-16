interface BearBoxEntry {
  name: string
  rarity: string
  chanceWeight: number
  imagePath: string
}

const bearBoxEntries: BearBoxEntry[] = [
  {
    name: "Stapler",
    rarity: "N",
    chanceWeight: 50,
    imagePath: "static/bearbox/stapler.jpg",
  },
  {
    name: "Lightsaber",
    rarity: "N",
    chanceWeight: 50,
    imagePath: "static/bearbox/lightsaber.jpg",
  },
  {
    name: "Retro Stapler",
    rarity: "R",
    chanceWeight: 10,
    imagePath: "static/bearbox/retrostapler.jpg",
  },
  {
    name: "Rhesus Macaque",
    rarity: "R",
    chanceWeight: 10,
    imagePath: "static/bearbox/rhesus.webp",
  },
  {
    name: "Sun Bear",
    rarity: "R",
    chanceWeight: 10,
    imagePath: "static/bearbox/sunbear.jpg",
  },
  {
    name: "Sloth Bear",
    rarity: "R",
    chanceWeight: 10,
    imagePath: "static/bearbox/slothbear.webp",
  },
  {
    name: "Red Panda",
    rarity: "SR",
    chanceWeight: 5,
    imagePath: "static/bearbox/redpanda.webp",
  },
  {
    name: "Red Stapler",
    rarity: "SSR",
    chanceWeight: 1,
    imagePath: "static/bearbox/redstapler.webp",
  },
  {
    name: "Emu",
    rarity: "SSR",
    chanceWeight: 1,
    imagePath: "static/bearbox/emu.png",
  },
];

export function pullBearBox(): BearBoxEntry {
  const cumWeights = [];
  let acc = 0;
  for (const entry of bearBoxEntries) {
    acc += entry.chanceWeight;
    cumWeights.push(acc);
  }

  const totalChanceWeight = bearBoxEntries.map((entry) => entry.chanceWeight)
    .reduce((acc, v) => acc + v, 0);

  const v = Math.random() * totalChanceWeight;
  for (let i = 0; i < cumWeights.length; i++) {
    if (v < cumWeights[i]) {
      return bearBoxEntries[i];
    }
  }

  throw new Error("this should not happen");
}