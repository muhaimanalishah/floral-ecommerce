import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";
import "dotenv/config";

const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
};

const prisma = createPrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.orderStatusHistory.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  console.log("Cleaned.");

  console.log("Seeding categories...");
  const categoriesData = [
    { name: "Indoor", description: "Beautiful plants to green up your indoor spaces, apartments, and offices." },
    { name: "Outdoor", description: "Hardy plants, trees, and shrubs suitable for gardens, balconies, and patios." },
    { name: "Succulents", description: "Drought-tolerant plants like cacti and echeveria that require minimal watering." },
    { name: "Flowering", description: "Plants that produce colorful and fragrant blooms throughout their seasons." },
    { name: "Medicinal", description: "Herbs and plants valued for their health benefits and traditional healing properties." }
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: cat
    });
    categories[cat.name] = created;
  }
  console.log(`Seeded ${Object.keys(categories).length} categories.`);

  console.log("Seeding products...");
  const productsData = [
    {
      name: "Snake Plant",
      slug: "snake-plant",
      botanicalName: "Sansevieria trifasciata",
      productType: "PLANT" as const,
      price: 1500.00,
      size: "MEDIUM" as const,
      sunlightReq: "Indirect low to bright light",
      wateringFreq: "Every 2-3 weeks",
      soilType: "Loose, well-drained potting mix",
      temperatureRange: "15°C - 29°C",
      lowMaintenance: true,
      petFriendly: false,
      growthRate: "SLOW" as const,
      stockQty: 15,
      description: "The Snake Plant is one of the hardiest house plants available. It thrives on neglect and can survive in low light conditions, making it perfect for beginners.",
      isActive: true,
      categoryName: "Indoor",
      imageUrl: "https://images.unsplash.com/photo-1593487568522-746db8894941?q=80&w=600&auto=format&fit=crop"
    },
    {
      name: "Monstera Deliciosa",
      slug: "monstera-deliciosa",
      botanicalName: "Monstera deliciosa",
      productType: "PLANT" as const,
      price: 3500.00,
      size: "LARGE" as const,
      sunlightReq: "Bright indirect sunlight",
      wateringFreq: "Every 1-2 weeks",
      soilType: "Peat-based potting mix",
      temperatureRange: "18°C - 30°C",
      lowMaintenance: false,
      petFriendly: false,
      growthRate: "FAST" as const,
      stockQty: 3, // Low stock for dashboard warnings!
      description: "Known for its iconic split leaves, the Monstera Deliciosa adds a tropical vibe to any room. It is a climbing evergreen that requires space to grow.",
      isActive: true,
      categoryName: "Indoor",
      imageUrl: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=600&auto=format&fit=crop"
    },
    {
      name: "Boston Fern",
      slug: "boston-fern",
      botanicalName: "Nephrolepis exaltata",
      productType: "PLANT" as const,
      price: 1200.00,
      size: "MEDIUM" as const,
      sunlightReq: "Bright indirect light, high humidity",
      wateringFreq: "Every 2-3 days, keep soil moist",
      soilType: "Peat-based soil mix",
      temperatureRange: "16°C - 24°C",
      lowMaintenance: false,
      petFriendly: true,
      growthRate: "FAST" as const,
      stockQty: 12,
      description: "Boston Ferns are classic houseplants with graceful, arching fronds. They love humidity and moist soil, making them great for bathrooms.",
      isActive: true,
      categoryName: "Indoor",
      imageUrl: "https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=600&auto=format&fit=crop"
    },
    {
      name: "Aloe Vera",
      slug: "aloe-vera",
      botanicalName: "Aloe barbadensis miller",
      productType: "PLANT" as const,
      price: 800.00,
      size: "SMALL" as const,
      sunlightReq: "Direct sun or bright indirect light",
      wateringFreq: "Every 3 weeks",
      soilType: "Sandy, well-draining cactus mix",
      temperatureRange: "13°C - 27°C",
      lowMaintenance: true,
      petFriendly: false,
      growthRate: "SLOW" as const,
      stockQty: 25,
      description: "Aloe Vera is a stemless succulent renowned for the soothing gel inside its fleshy leaves. It is both beautiful and useful.",
      isActive: true,
      categoryName: "Medicinal",
      imageUrl: "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?q=80&w=600&auto=format&fit=crop"
    },
    {
      name: "English Ivy",
      slug: "english-ivy",
      botanicalName: "Hedera helix",
      productType: "PLANT" as const,
      price: 950.00,
      size: "MEDIUM" as const,
      sunlightReq: "Part shade to full shade",
      wateringFreq: "Once a week",
      soilType: "Rich, organic, well-drained soil",
      temperatureRange: "10°C - 25°C",
      lowMaintenance: true,
      petFriendly: false,
      growthRate: "FAST" as const,
      stockQty: 4, // Low stock!
      description: "English Ivy is a climbing or trailing vine that forms a dense groundcover or climbs walls and trellises. Perfect for outdoor walls.",
      isActive: true,
      categoryName: "Outdoor",
      imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?q=80&w=600&auto=format&fit=crop"
    },
    {
      name: "Lavender",
      slug: "lavender",
      botanicalName: "Lavandula angustifolia",
      productType: "PLANT" as const,
      price: 1800.00,
      size: "MEDIUM" as const,
      sunlightReq: "Full sun",
      wateringFreq: "Once the soil is completely dry",
      soilType: "Dry, sandy, well-draining alkaline soil",
      temperatureRange: "15°C - 32°C",
      lowMaintenance: true,
      petFriendly: true,
      growthRate: "SLOW" as const,
      stockQty: 8,
      description: "Lavender is a fragrant, flowering shrub prized for its beautiful purple blooms and calming scent. Excellent for outdoor gardens or sunny windowsills.",
      isActive: true,
      categoryName: "Flowering",
      imageUrl: "https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?q=80&w=600&auto=format&fit=crop"
    },
    {
      name: "Echinacea (Coneflower)",
      slug: "echinacea-coneflower",
      botanicalName: "Echinacea purpurea",
      productType: "PLANT" as const,
      price: 1100.00,
      size: "MEDIUM" as const,
      sunlightReq: "Full sun to partial shade",
      wateringFreq: "Once a week",
      soilType: "Loamy, well-drained soil",
      temperatureRange: "18°C - 30°C",
      lowMaintenance: true,
      petFriendly: true,
      growthRate: "FAST" as const,
      stockQty: 30,
      description: "Echinacea, or coneflower, is a popular perennial herb used in traditional medicine to support the immune system. Features gorgeous daisy-like flowers.",
      isActive: true,
      categoryName: "Medicinal",
      imageUrl: "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?q=80&w=600&auto=format&fit=crop"
    },
    {
      name: "Echeveria Elegans",
      slug: "echeveria-elegans",
      botanicalName: "Echeveria elegans",
      productType: "PLANT" as const,
      price: 600.00,
      size: "SMALL" as const,
      sunlightReq: "Full sun to bright indirect light",
      wateringFreq: "Every 2 weeks (soak and dry method)",
      soilType: "Very well-draining succulent mix",
      temperatureRange: "15°C - 27°C",
      lowMaintenance: true,
      petFriendly: true,
      growthRate: "SLOW" as const,
      stockQty: 40,
      description: "Echeveria Elegans, also known as Mexican Snowball, forms beautiful rose-like tight rosettes of pale blue-green leaves.",
      isActive: true,
      categoryName: "Succulents",
      imageUrl: "https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?q=80&w=600&auto=format&fit=crop"
    },
    {
      name: "Premium Clay Pot",
      slug: "premium-clay-pot",
      botanicalName: "N/A",
      productType: "ACCESSORY" as const,
      price: 1500.00,
      size: "MEDIUM" as const,
      sunlightReq: "N/A",
      wateringFreq: "N/A",
      soilType: "N/A",
      temperatureRange: "N/A",
      lowMaintenance: true,
      petFriendly: true,
      growthRate: "SLOW" as const,
      stockQty: 50,
      description: "A premium hand-crafted terracotta clay pot, perfect for succulents and medium-sized plants. Provides excellent soil aeration.",
      isActive: true,
      categoryName: "Outdoor",
      imageUrl: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=600&auto=format&fit=crop"
    }
  ];

  const products: Record<string, any> = {};
  for (const prod of productsData) {
    const { categoryName, imageUrl, ...prodFields } = prod;
    const category = categories[categoryName];
    
    const created = await prisma.product.create({
      data: {
        ...prodFields,
        categoryId: category.id,
        images: {
          create: {
            url: imageUrl,
            isPrimary: true,
            sortOrder: 0
          }
        }
      }
    });
    products[prod.name] = created;
  }
  console.log(`Seeded ${Object.keys(products).length} products.`);

  console.log("Seeding users...");
  const hashedPassword = hashSync("password123", 10);
  const adminPassword = hashSync("admin123", 10);

  const usersData = [
    {
      fullName: "Flora Admin",
      email: "admin@florafetch.com",
      phone: "+923001234567",
      hashedPassword: adminPassword,
      role: "ADMIN" as const,
      isActive: true
    },
    {
      fullName: "John Doe",
      email: "john@example.com",
      phone: "+923007654321",
      hashedPassword: hashedPassword,
      role: "CUSTOMER" as const,
      isActive: true
    },
    {
      fullName: "Jane Smith",
      email: "jane@example.com",
      phone: "+923001122334",
      hashedPassword: hashedPassword,
      role: "CUSTOMER" as const,
      isActive: true
    },
    {
      fullName: "Bob Johnson",
      email: "bob@example.com",
      phone: "+923005566778",
      hashedPassword: hashedPassword,
      role: "CUSTOMER" as const,
      isActive: true
    },
    {
      fullName: "Suspended User",
      email: "deactivated@example.com",
      phone: "+923009988776",
      hashedPassword: hashedPassword,
      role: "CUSTOMER" as const,
      isActive: false
    }
  ];

  const users: Record<string, any> = {};
  for (const u of usersData) {
    const created = await prisma.user.create({
      data: u
    });
    users[u.email] = created;
  }
  console.log(`Seeded ${Object.keys(users).length} users.`);

  console.log("Seeding addresses...");
  const johnAddress = await prisma.address.create({
    data: {
      userId: users["john@example.com"].id,
      label: "Home",
      street: "House 45, Street 12, Sector F-10",
      city: "Islamabad",
      province: "ICT",
      postalCode: "44000",
      isDefault: true
    }
  });

  const janeAddress = await prisma.address.create({
    data: {
      userId: users["jane@example.com"].id,
      label: "Office",
      street: "Tech Hub, 3rd Floor, Software Park",
      city: "Lahore",
      province: "Punjab",
      postalCode: "54000",
      isDefault: true
    }
  });

  const bobAddress = await prisma.address.create({
    data: {
      userId: users["bob@example.com"].id,
      label: "Home",
      street: "Flat A-3, Garden Apartments, Clifton",
      city: "Karachi",
      province: "Sindh",
      postalCode: "75500",
      isDefault: true
    }
  });
  console.log("Seeded addresses.");

  console.log("Seeding orders and order status histories...");
  // Order 1: John, status: DELIVERED, items: Boston Fern (qty 1), Clay Pot (qty 1)
  const o1 = await prisma.order.create({
    data: {
      userId: users["john@example.com"].id,
      addressId: johnAddress.id,
      status: "DELIVERED" as const,
      totalAmount: 2700.00,
      deliveryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      specialInstructions: "Please handle carefully, fragile green stems.",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      items: {
        create: [
          {
            productId: products["Boston Fern"].id,
            quantity: 1,
            unitPrice: 1200.00,
            subtotal: 1200.00
          },
          {
            productId: products["Premium Clay Pot"].id,
            quantity: 1,
            unitPrice: 1500.00,
            subtotal: 1500.00
          }
        ]
      },
      statusHistory: {
        create: [
          { status: "ORDER_CONFIRMED", note: "Order placed successfully via COD", changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
          { status: "QUALITY_CHECK", note: "Nursery team checked foliage and root structure", changedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
          { status: "IN_TRANSIT", note: "Handed over to delivery agent in ventilated packaging", changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { status: "DELIVERED", note: "Cash collected and plant received in good health", changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
        ]
      }
    }
  });

  // Order 2: Jane, status: IN_TRANSIT, items: Snake Plant (qty 2)
  const o2 = await prisma.order.create({
    data: {
      userId: users["jane@example.com"].id,
      addressId: janeAddress.id,
      status: "IN_TRANSIT" as const,
      totalAmount: 3000.00,
      specialInstructions: "Deliver between 9 AM to 5 PM only.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      items: {
        create: [
          {
            productId: products["Snake Plant"].id,
            quantity: 2,
            unitPrice: 1500.00,
            subtotal: 3000.00
          }
        ]
      },
      statusHistory: {
        create: [
          { status: "ORDER_CONFIRMED", note: "Order placed successfully", changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          { status: "QUALITY_CHECK", note: "Moistened soil and packaged in box", changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
          { status: "IN_TRANSIT", note: "Dispatched from nursery", changedAt: new Date(Date.now() - 12 * 60 * 60 * 1000) }
        ]
      }
    }
  });

  // Order 3: Bob, status: QUALITY_CHECK, items: Monstera Deliciosa (qty 1), Aloe Vera (qty 1)
  const o3 = await prisma.order.create({
    data: {
      userId: users["bob@example.com"].id,
      addressId: bobAddress.id,
      status: "QUALITY_CHECK" as const,
      totalAmount: 4300.00,
      specialInstructions: "Leave with security if not home.",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      items: {
        create: [
          {
            productId: products["Monstera Deliciosa"].id,
            quantity: 1,
            unitPrice: 3500.00,
            subtotal: 3500.00
          },
          {
            productId: products["Aloe Vera"].id,
            quantity: 1,
            unitPrice: 800.00,
            subtotal: 800.00
          }
        ]
      },
      statusHistory: {
        create: [
          { status: "ORDER_CONFIRMED", note: "Order received", changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
          { status: "QUALITY_CHECK", note: "Selecting the healthiest Monstera specimen", changedAt: new Date(Date.now() - 4 * 60 * 60 * 1000) }
        ]
      }
    }
  });

  // Order 4: John, status: ORDER_CONFIRMED, items: Lavender (qty 1)
  const o4 = await prisma.order.create({
    data: {
      userId: users["john@example.com"].id,
      addressId: johnAddress.id,
      status: "ORDER_CONFIRMED" as const,
      totalAmount: 1800.00,
      createdAt: new Date(),
      items: {
        create: [
          {
            productId: products["Lavender"].id,
            quantity: 1,
            unitPrice: 1800.00,
            subtotal: 1800.00
          }
        ]
      },
      statusHistory: {
        create: [
          { status: "ORDER_CONFIRMED", note: "Awaiting nursery confirmation" }
        ]
      }
    }
  });
  console.log("Seeded orders.");

  console.log("Seeding reviews...");
  // Review 1: John for Boston Fern (Approved)
  await prisma.review.create({
    data: {
      userId: users["john@example.com"].id,
      productId: products["Boston Fern"].id,
      rating: 5,
      healthRating: 5,
      reviewText: "Absolutely lovely! The plant arrived in perfect condition, so healthy and fresh. It fits beautifully in my living room.",
      isApproved: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  });

  // Review 2: Jane for Snake Plant (Approved with Admin reply)
  await prisma.review.create({
    data: {
      userId: users["jane@example.com"].id,
      productId: products["Snake Plant"].id,
      rating: 4,
      healthRating: 5,
      reviewText: "Great plant, very low maintenance. Arrived in excellent condition.",
      isApproved: true,
      adminReply: "Thank you Jane! Yes, Snake Plants are highly resilient. Just remember to let the soil dry out completely between waterings.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  });

  // Review 3: Bob for Aloe Vera (Pending approval)
  await prisma.review.create({
    data: {
      userId: users["bob@example.com"].id,
      productId: products["Aloe Vera"].id,
      rating: 3,
      healthRating: 3,
      reviewText: "The plant is okay but some leaves were bruised during transit. Hopefully it recovers.",
      isApproved: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  });

  // Review 4: John for Monstera Deliciosa (Pending approval)
  await prisma.review.create({
    data: {
      userId: users["john@example.com"].id,
      productId: products["Monstera Deliciosa"].id,
      rating: 5,
      healthRating: 5,
      reviewText: "Beautiful Monstera, leaves are huge! Exceeded my expectations.",
      isApproved: false,
      createdAt: new Date()
    }
  });
  console.log("Seeded reviews.");

  console.log("Seeding complete successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
