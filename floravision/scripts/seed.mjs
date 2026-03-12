import "dotenv/config";
import { randomBytes, scryptSync } from "node:crypto";
import { resolve } from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

function getDbProvider() {
  return process.env.FLORAVISION_DB_PROVIDER ?? "sqlite";
}

function resolveSqlitePath(databaseUrl) {
  if (!databaseUrl?.startsWith("file:")) {
    throw new Error("DATABASE_URL must use sqlite file: syntax.");
  }

  return resolve(process.cwd(), databaseUrl.replace(/^file:/, ""));
}

function createPrismaClient() {
  if (getDbProvider() === "sqlite") {
    const adapter = new PrismaBetterSqlite3({
      url: resolveSqlitePath(process.env.DATABASE_URL),
    });

    return new PrismaClient({ adapter });
  }

  if (process.env.DATABASE_URL?.startsWith("file:")) {
    throw new Error("Postgres mode cannot use a file: DATABASE_URL.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

function createPasswordHash(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  await prisma.deliveryItemCheck.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.orderPhoto.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shop.deleteMany();

  await prisma.user.create({
    data: {
      name: "FloraVision Admin",
      email: "admin@floravision.local",
      passwordHash: createPasswordHash("admin1234"),
      platformRole: "PLATFORM_ADMIN",
    },
  });

  const shop = await prisma.shop.create({
    data: {
      slug: "petals-and-post",
      name: "Petals & Post",
      legalName: "Petals & Post Floral Studio",
      timezone: "America/Chicago",
      phone: "(555) 014-1290",
      email: "hello@petalsandpost.com",
      websiteUrl: "https://petalsandpost.example.com",
    },
  });

  const ownerUser = await prisma.user.create({
    data: {
      name: "Tasha Carr",
      email: "tasha@petalsandpost.com",
      passwordHash: createPasswordHash("petals123"),
    },
  });

  const designerUser = await prisma.user.create({
    data: {
      name: "Eli Morgan",
      email: "eli@petalsandpost.com",
      passwordHash: createPasswordHash("designer123"),
    },
  });

  const driverUser = await prisma.user.create({
    data: {
      name: "Jamie Reed",
      email: "jamie@petalsandpost.com",
      passwordHash: createPasswordHash("driver123"),
    },
  });

  const [owner, designer, driver] = await Promise.all([
    prisma.staffMember.create({
      data: {
        shopId: shop.id,
        firstName: "Tasha",
        lastName: "Carr",
        displayName: "Tasha",
        email: "tasha@petalsandpost.com",
        role: "OWNER",
      },
    }),
    prisma.staffMember.create({
      data: {
        shopId: shop.id,
        firstName: "Eli",
        lastName: "Morgan",
        displayName: "Eli",
        email: "eli@petalsandpost.com",
        role: "DESIGNER",
      },
    }),
    prisma.staffMember.create({
      data: {
        shopId: shop.id,
        firstName: "Jamie",
        lastName: "Reed",
        displayName: "Jamie",
        email: "jamie@petalsandpost.com",
        role: "DRIVER",
      },
    }),
  ]);

  await prisma.membership.create({
    data: {
      userId: ownerUser.id,
      shopId: shop.id,
      staffMemberId: owner.id,
      role: "OWNER",
      isDefault: true,
    },
  });

  await prisma.membership.create({
    data: {
      userId: designerUser.id,
      shopId: shop.id,
      staffMemberId: designer.id,
      role: "DESIGNER",
      isDefault: true,
    },
  });

  await prisma.membership.create({
    data: {
      userId: driverUser.id,
      shopId: shop.id,
      staffMemberId: driver.id,
      role: "DRIVER",
      isDefault: true,
    },
  });

  const sarah = await prisma.customer.create({
    data: {
      shopId: shop.id,
      name: "Sarah Whitmore",
      email: "sarah@example.com",
      phone: "(555) 011-8811",
      reminders: "Anniversary and birthday buyer",
      notes: "Prefers soft romantic palettes and likes arrangement photos retained.",
    },
  });

  const adrian = await prisma.customer.create({
    data: {
      shopId: shop.id,
      name: "Adrian Keller",
      email: "adrian@example.com",
      phone: "(555) 016-4419",
      reminders: "Frequently sends designer's choice",
    },
  });

  const [sarahAddress, adrianAddress] = await Promise.all([
    prisma.address.create({
      data: {
        shopId: shop.id,
        customerId: sarah.id,
        label: "Home",
        recipientName: "Sarah Whitmore",
        line1: "1442 Willow Garden Lane",
        city: "Springfield",
        state: "IL",
        postalCode: "62704",
        deliveryNotes: "Blue porch swing near front door.",
      },
    }),
    prisma.address.create({
      data: {
        shopId: shop.id,
        customerId: adrian.id,
        label: "Office",
        recipientName: "Adrian Keller",
        line1: "220 Market Square",
        line2: "Suite 400",
        city: "Springfield",
        state: "IL",
        postalCode: "62701",
        deliveryNotes: "Front desk accepts packages and floral deliveries.",
      },
    }),
  ]);

  const [arrangementProduct, balloonProduct, teddyBearProduct, chocolateProduct] = await Promise.all([
    prisma.product.create({
      data: {
        shopId: shop.id,
        sku: "DC-085",
        name: "Designer's Choice Arrangement",
        type: "ARRANGEMENT",
        basePrice: 8500,
      },
    }),
    prisma.product.create({
      data: {
        shopId: shop.id,
        sku: "ADD-BAL",
        name: "Celebration Balloon",
        type: "ADD_ON",
        basePrice: 900,
      },
    }),
    prisma.product.create({
      data: {
        shopId: shop.id,
        sku: "ADD-BEAR",
        name: "Plush Teddy Bear",
        type: "ADD_ON",
        basePrice: 1800,
      },
    }),
    prisma.product.create({
      data: {
        shopId: shop.id,
        sku: "ADD-CHOCO",
        name: "Chocolate Box",
        type: "ADD_ON",
        basePrice: 1400,
      },
    }),
  ]);

  const order10428 = await prisma.order.create({
    data: {
      shopId: shop.id,
      orderNumber: "10428",
      customerId: sarah.id,
      occasion: "Bright Birthday",
      cardMessage: "Happy Birthday, Sarah. Love you bunches.",
      budgetAmount: 8500,
      totalAmount: 9400,
      status: "READY_FOR_PICKUP",
      fulfillmentType: "PICKUP",
      dueAt: new Date("2026-03-12T09:30:00-05:00"),
      assignedDesignerId: owner.id,
      deliveryAddressId: sarahAddress.id,
      notes: "Customer asked for bright and spring-heavy colors.",
      internalSummary: "Use tulips or gerbera if premium focal flowers are limited.",
    },
  });

  const order10441 = await prisma.order.create({
    data: {
      shopId: shop.id,
      orderNumber: "10441",
      customerId: adrian.id,
      occasion: "Designer's Choice",
      cardMessage: "Thinking of you and hoping this brightens your day.",
      budgetAmount: 8500,
      totalAmount: 11700,
      status: "OUT_FOR_DELIVERY",
      fulfillmentType: "DELIVERY",
      dueAt: new Date("2026-03-12T11:00:00-05:00"),
      assignedDesignerId: designer.id,
      deliveryAddressId: adrianAddress.id,
      notes: "Soft romantic palette, value should feel lush at $85.",
      internalSummary: "Multi-piece order. Driver must verify all add-ons before departure.",
    },
  });

  const [primary10428, balloon10428] = await Promise.all([
    prisma.orderItem.create({
      data: {
        orderId: order10428.id,
        productId: arrangementProduct.id,
        description: "Bright birthday arrangement",
        quantity: 1,
        unitPrice: 8500,
        isPrimaryDesign: true,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: order10428.id,
        productId: balloonProduct.id,
        description: "Celebration balloon",
        quantity: 1,
        unitPrice: 900,
        requiresScan: true,
      },
    }),
  ]);

  const [primary10441, teddy10441, chocolate10441] = await Promise.all([
    prisma.orderItem.create({
      data: {
        orderId: order10441.id,
        productId: arrangementProduct.id,
        description: "Designer's choice arrangement",
        quantity: 1,
        unitPrice: 8500,
        isPrimaryDesign: true,
        requiresScan: true,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: order10441.id,
        productId: teddyBearProduct.id,
        description: "Plush teddy bear",
        quantity: 1,
        unitPrice: 1800,
        requiresScan: true,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: order10441.id,
        productId: chocolateProduct.id,
        description: "Chocolate box",
        quantity: 1,
        unitPrice: 1400,
        requiresScan: true,
      },
    }),
  ]);

  await prisma.orderPhoto.createMany({
    data: [
      {
        orderId: order10428.id,
        customerId: sarah.id,
        capturedById: owner.id,
        kind: "ARRANGEMENT",
        imageUrl: "https://images.example.com/orders/10428-arrangement.jpg",
        caption: "Birthday arrangement from two orders ago.",
      },
      {
        orderId: order10428.id,
        customerId: sarah.id,
        capturedById: owner.id,
        kind: "DELIVERY_PROOF",
        imageUrl: "https://images.example.com/orders/10428-door.jpg",
        caption: "Placed safely at the front door.",
      },
      {
        orderId: order10441.id,
        customerId: adrian.id,
        capturedById: designer.id,
        kind: "ARRANGEMENT",
        imageUrl: "https://images.example.com/orders/10441-arrangement.jpg",
        caption: "Final arrangement before departure.",
      },
    ],
  });

  const delivery10441 = await prisma.delivery.create({
    data: {
      shopId: shop.id,
      orderId: order10441.id,
      driverId: driver.id,
      status: "LOADED",
      routeName: "North Loop Morning",
      stopSequence: 2,
      loadedAt: new Date("2026-03-12T10:20:00-05:00"),
      handoffType: "APARTMENT_FRONT_DESK",
      handoffNotes: "Front desk usually signs for deliveries.",
    },
  });

  await prisma.deliveryItemCheck.createMany({
    data: [
      {
        deliveryId: delivery10441.id,
        orderItemId: primary10441.id,
        checkedById: driver.id,
        note: "Arrangement scanned at loading table.",
      },
    ],
  });

  await prisma.timeEntry.createMany({
    data: [
      {
        shopId: shop.id,
        staffMemberId: owner.id,
        startedAt: new Date("2026-03-12T07:55:00-05:00"),
      },
      {
        shopId: shop.id,
        staffMemberId: designer.id,
        startedAt: new Date("2026-03-12T08:02:00-05:00"),
      },
      {
        shopId: shop.id,
        staffMemberId: driver.id,
        startedAt: new Date("2026-03-12T09:15:00-05:00"),
      },
      {
        shopId: shop.id,
        staffMemberId: designer.id,
        startedAt: new Date("2026-03-11T08:05:00-05:00"),
        overrideReason: "Missed clock-out, needs manager review",
      },
    ],
  });

  const [redRoses, whiteHydrangea, pinkSprayRoses] = await Promise.all([
    prisma.inventoryItem.create({
      data: {
        shopId: shop.id,
        name: "Rose",
        color: "Red",
        category: "Focal",
        unit: "STEM",
        quantityOnHand: 42,
        freshnessNote: "Projected shortage by 2:45 PM.",
      },
    }),
    prisma.inventoryItem.create({
      data: {
        shopId: shop.id,
        name: "Hydrangea",
        color: "White",
        category: "Focal",
        unit: "STEM",
        quantityOnHand: 12,
        freshnessNote: "Use today.",
      },
    }),
    prisma.inventoryItem.create({
      data: {
        shopId: shop.id,
        name: "Spray Rose",
        color: "Pink",
        category: "Accent",
        unit: "STEM",
        quantityOnHand: 28,
        freshnessNote: "Peak bloom.",
      },
    }),
  ]);

  await prisma.inventoryMovement.createMany({
    data: [
      {
        shopId: shop.id,
        itemId: redRoses.id,
        orderId: order10441.id,
        createdById: designer.id,
        type: "DESIGN_USE",
        quantity: -6,
        note: "Used in designer's choice arrangement.",
      },
      {
        shopId: shop.id,
        itemId: whiteHydrangea.id,
        orderId: order10441.id,
        createdById: designer.id,
        type: "DESIGN_USE",
        quantity: -2,
        note: "Used as volume bloom.",
      },
      {
        shopId: shop.id,
        itemId: pinkSprayRoses.id,
        orderId: order10428.id,
        createdById: owner.id,
        type: "DESIGN_USE",
        quantity: -4,
        note: "Added for birthday palette.",
      },
    ],
  });

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      shopId: shop.id,
      poNumber: "PO-2026-001",
      vendorName: "DVFlora",
      status: "PARTIALLY_RECEIVED",
      expectedAt: new Date("2026-03-13T08:00:00-05:00"),
      notes: "Holiday preload on focal blooms.",
    },
  });

  const purchaseOrderLine = await prisma.purchaseOrderLine.create({
    data: {
      purchaseOrderId: purchaseOrder.id,
      inventoryItemId: redRoses.id,
      description: "Red roses holiday restock",
      orderedQuantity: 120,
      receivedQuantity: 60,
      unitCostCents: 225,
    },
  });

  await prisma.inventoryMovement.create({
    data: {
      shopId: shop.id,
      itemId: redRoses.id,
      purchaseOrderLineId: purchaseOrderLine.id,
      createdById: owner.id,
      type: "RECEIPT",
      quantity: 60,
      note: "Initial PO receipt for PO-2026-001",
    },
  });

  const proposal = await prisma.proposal.create({
    data: {
      shopId: shop.id,
      customerId: sarah.id,
      proposalNumber: "PROP-2026-001",
      title: "Whitmore Wedding Floral Proposal",
      type: "WEDDING",
      status: "DRAFT",
      eventDate: new Date("2026-06-20T15:00:00-05:00"),
      venue: "The Grand Conservatory",
      contactName: "Sarah Whitmore",
      contactEmail: "sarah@example.com",
      notes: "Soft garden palette with blush, ivory, and airy movement.",
    },
  });

  await prisma.proposalLine.createMany({
    data: [
      {
        proposalId: proposal.id,
        description: "Bridal bouquet",
        quantity: 1,
        unitPrice: 18500,
      },
      {
        proposalId: proposal.id,
        description: "Bridesmaid bouquet package",
        quantity: 4,
        unitPrice: 8500,
      },
      {
        proposalId: proposal.id,
        description: "Ceremony floral installation",
        quantity: 1,
        unitPrice: 42500,
      },
    ],
  });

  console.log(`Seeded shop ${shop.name} (${shop.slug})`);
  console.log(`Sample order detail: /shops/${shop.slug}/orders/10441`);
  console.log(`Platform admin login: admin@floravision.local / admin1234`);
  console.log(`Shop owner login: ${ownerUser.email} / petals123`);
  console.log(`Designer login: ${designerUser.email} / designer123`);
  console.log(`Driver login: ${driverUser.email} / driver123`);
  console.log(`Seed references: ${primary10428.id}, ${balloon10428.id}, ${teddy10441.id}, ${chocolate10441.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
