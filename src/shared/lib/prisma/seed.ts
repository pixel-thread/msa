import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const getImageUrl = (name: string) =>
    `https://picsum.photos/800/600?random=${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}`;

  const productsData = [
    {
      name: "Classic Country",
      description:
        "Our signature sourdough loaf, crafted with heritage wheat, rye, and sea salt. Fermented for 72 hours for a deep, complex flavor.",
      price: 120,
      category: "BREAD",
      stock: 25,
      isFeatured: true,
      isActive: true,
    },
    {
      name: "Heirloom Cacao",
      description:
        "Rich, buttery pastry filled with 72% single-origin dark chocolate. A true artisan classic.",
      price: 180,
      category: "PASTRY",
      stock: 30,
      isFeatured: true,
      isActive: true,
    },
    {
      name: "Rosemary Focaccia",
      description:
        "Soft, olive-oil rich focaccia topped with fresh rosemary and Maldon sea salt. Baked to golden perfection.",
      price: 140,
      category: "BREAD",
      stock: 20,
      isFeatured: true,
      isActive: true,
    },
    {
      name: "Wild Berry Tart",
      description:
        "Delicate pastry shell filled with seasonal wild berries and a light honey glaze.",
      price: 220,
      category: "PASTRY",
      stock: 15,
      isFeatured: true,
      isActive: true,
    },
    {
      name: "Spiced Rye Loaf",
      description:
        "Dense, nutrient-rich rye bread with toasted caraway and coriander seeds.",
      price: 160,
      category: "BREAD",
      stock: 12,
      isFeatured: false,
      isActive: true,
    },
    {
      name: "Almond Croissant",
      description:
        "Twice-baked croissant with house-made almond frangipane and toasted almond slivers.",
      price: 190,
      category: "PASTRY",
      stock: 15,
      isFeatured: false,
      isActive: true,
    },
    {
      name: "Honey Lavender Tea Cake",
      description:
        "Light, floral cake infused with local honey and organic lavender buds.",
      price: 350,
      category: "CAKE",
      stock: 8,
      isFeatured: false,
      isActive: true,
    },
    {
      name: "Dark Chocolate Ganache Cake",
      description:
        "Decadent dark chocolate layers with a silky smooth ganache finish. Serves 8-10.",
      price: 650,
      category: "CAKE",
      stock: 5,
      isFeatured: true,
      isActive: true,
    },
  ];

  await Promise.all(
    productsData.map((product) =>
      prisma.product.upsert({
        where: { name: product.name },
        update: {
          ...product,
          imageUrl: getImageUrl(product.name),
        },
        create: {
          ...product,
          imageUrl: getImageUrl(product.name),
        },
      }),
    ),
  );

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
