import { prisma } from "@/lib/prisma";
import {
  customerPhotos as fallbackCustomerPhotos,
  dashboardOrders as fallbackOrders,
  deliveryProofOptions,
  quickSearch,
  type DashboardOrderStatus,
} from "@/lib/dashboard-data";
import type { PlatformRole, FulfillmentType, OrderStatus } from "@prisma/client";

function mapOrderStatus(
  status: "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY" | "DESIGNING" | "DRAFT" | "CONFIRMED" | "COMPLETED" | "CANCELLED",
  hasDesigner: boolean,
): DashboardOrderStatus {
  if (status === "READY_FOR_PICKUP") {
    return "Ready for pickup";
  }

  if (status === "OUT_FOR_DELIVERY") {
    return "Out for delivery";
  }

  return hasDesigner ? "Designing" : "Awaiting assignment";
}

export async function getHomePageData(shopSlug?: string) {
  try {
    const shop = await prisma.shop.findFirst({
      where: shopSlug ? { slug: shopSlug } : undefined,
      orderBy: { createdAt: "asc" },
      include: {
        orders: {
          orderBy: { dueAt: "asc" },
          take: 3,
          include: {
            customer: true,
            assignedDesigner: true,
            items: true,
            delivery: true,
          },
        },
        customers: {
          orderBy: { createdAt: "asc" },
          take: 1,
          include: {
            photos: {
              orderBy: { takenAt: "desc" },
              take: 3,
            },
          },
        },
        inventoryItems: {
          orderBy: { quantityOnHand: "desc" },
          take: 3,
        },
        timeEntries: {
          where: { endedAt: null },
        },
      },
    });

    if (!shop) {
      return {
        mode: "fallback" as const,
        shopName: "FloraVision Demo",
        shopSlug: "demo-shop",
        quickSearch,
        orders: fallbackOrders.map((order) => ({
          ...order,
          href: "#",
        })),
        customerName: "Sarah Whitmore",
        customerSummary: "Customer history will appear here once the sample shop is seeded.",
        customerPhotos: fallbackCustomerPhotos,
        deliveryProofOptions,
        inventoryWatch: "Red Roses",
        inventoryNote: "Projected shortage by 2:45 PM.",
        openTimeEntries: 3,
      };
    }

    const firstCustomer = shop.customers[0];
    const firstInventory = shop.inventoryItems[0];

    return {
      mode: "database" as const,
      shopName: shop.name,
      shopSlug: shop.slug,
      quickSearch,
      orders: shop.orders.map((order) => ({
        id: order.orderNumber,
        occasion: order.occasion,
        customer: order.customer.name,
        designer: order.assignedDesigner?.displayName ?? "Unassigned",
        window: `${order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"} ${new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }).format(order.dueAt)}`,
        status: mapOrderStatus(order.status, Boolean(order.assignedDesigner)),
        components: order.items.map((item) => item.description),
        note: order.notes ?? order.internalSummary ?? "No additional notes.",
        href: `/shops/${shop.slug}/orders/${order.orderNumber}`,
      })),
      customerName: firstCustomer?.name ?? "No customer yet",
      customerSummary:
        firstCustomer?.notes ??
        firstCustomer?.reminders ??
        "Seed the sample shop to view customer memory.",
      customerPhotos:
        firstCustomer?.photos.map((photo, index) => ({
          title: photo.caption ?? `Photo ${index + 1}`,
          detail: photo.kind.replaceAll("_", " ").toLowerCase(),
        })) ?? fallbackCustomerPhotos,
      deliveryProofOptions,
      inventoryWatch: firstInventory?.name ?? "Inventory",
      inventoryNote: firstInventory?.freshnessNote ?? "No inventory alerts yet.",
      openTimeEntries: shop.timeEntries.length,
    };
  } catch {
    return {
      mode: "fallback" as const,
      shopName: "FloraVision Demo",
      shopSlug: "demo-shop",
      quickSearch,
      orders: fallbackOrders.map((order) => ({
        ...order,
        href: "#",
      })),
      customerName: "Sarah Whitmore",
      customerSummary: "Run the local database setup to load the seeded tenant shop.",
      customerPhotos: fallbackCustomerPhotos,
      deliveryProofOptions,
      inventoryWatch: "Red Roses",
      inventoryNote: "Projected shortage by 2:45 PM.",
      openTimeEntries: 3,
    };
  }
}

export async function listShops() {
  try {
    return await prisma.shop.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            orders: true,
            staffMembers: true,
            customers: true,
          },
        },
      },
    });
  } catch {
    return [];
  }
}

export async function listAccessibleShops(userId: string, platformRole: PlatformRole) {
  try {
    if (platformRole === "PLATFORM_ADMIN") {
      return await listShops();
    }

    return await prisma.shop.findMany({
      where: {
        memberships: {
          some: {
            userId,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            orders: true,
            staffMembers: true,
            customers: true,
          },
        },
      },
    });
  } catch {
    return [];
  }
}

export async function getShopBySlug(slug: string) {
  try {
    return await prisma.shop.findUnique({
      where: { slug },
      include: {
        orders: {
          orderBy: { dueAt: "asc" },
          include: {
            customer: true,
            assignedDesigner: true,
            delivery: true,
            items: true,
          },
        },
        staffMembers: {
          orderBy: { displayName: "asc" },
        },
        inventoryItems: {
          orderBy: { quantityOnHand: "desc" },
          take: 4,
        },
      },
    });
  } catch {
    return null;
  }
}

type ShopOrdersFilters = {
  status?: OrderStatus;
  fulfillmentType?: FulfillmentType;
  designerId?: string;
  query?: string;
};

export async function getShopOrders(slug: string, filters: ShopOrdersFilters = {}) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        staffMembers: {
          where: {
            role: {
              in: ["OWNER", "MANAGER", "DESIGNER"],
            },
          },
          orderBy: { displayName: "asc" },
          select: {
            id: true,
            displayName: true,
            role: true,
          },
        },
      },
    });

    if (!shop) {
      return null;
    }

    const orders = await prisma.order.findMany({
      where: {
        shopId: shop.id,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.fulfillmentType ? { fulfillmentType: filters.fulfillmentType } : {}),
        ...(filters.designerId ? { assignedDesignerId: filters.designerId } : {}),
        ...(filters.query
          ? {
              OR: [
                {
                  orderNumber: {
                    contains: filters.query,
                  },
                },
                {
                  occasion: {
                    contains: filters.query,
                  },
                },
                {
                  customer: {
                    name: {
                      contains: filters.query,
                    },
                  },
                },
                {
                  notes: {
                    contains: filters.query,
                  },
                },
                {
                  internalSummary: {
                    contains: filters.query,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      include: {
        customer: true,
        assignedDesigner: true,
        items: true,
        delivery: true,
      },
    });

    const [totalOrders, unassignedOrders, deliveryOrders, readyOrders] = await Promise.all([
      prisma.order.count({
        where: { shopId: shop.id },
      }),
      prisma.order.count({
        where: {
          shopId: shop.id,
          assignedDesignerId: null,
        },
      }),
      prisma.order.count({
        where: {
          shopId: shop.id,
          fulfillmentType: "DELIVERY",
        },
      }),
      prisma.order.count({
        where: {
          shopId: shop.id,
          status: "READY_FOR_PICKUP",
        },
      }),
    ]);

    return {
      shop,
      orders,
      summary: {
        totalOrders,
        unassignedOrders,
        deliveryOrders,
        readyOrders,
      },
    };
  } catch {
    return null;
  }
}

export async function getShopCustomers(slug: string, query?: string) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!shop) {
      return null;
    }

    const customers = await prisma.customer.findMany({
      where: {
        shopId: shop.id,
        ...(query
          ? {
              OR: [
                {
                  name: {
                    contains: query,
                  },
                },
                {
                  email: {
                    contains: query,
                  },
                },
                {
                  phone: {
                    contains: query,
                  },
                },
                {
                  notes: {
                    contains: query,
                  },
                },
                {
                  reminders: {
                    contains: query,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      include: {
        _count: {
          select: {
            orders: true,
            photos: true,
          },
        },
      },
    });

    return {
      shop,
      customers,
    };
  } catch {
    return null;
  }
}

export async function getCustomerDetail(shopSlug: string, customerId: string) {
  try {
    return await prisma.customer.findFirst({
      where: {
        id: customerId,
        shop: { slug: shopSlug },
      },
      include: {
        shop: true,
        addresses: true,
        photos: {
          orderBy: { takenAt: "desc" },
        },
        orders: {
          orderBy: { dueAt: "desc" },
          include: {
            assignedDesigner: true,
            items: true,
            delivery: true,
          },
        },
      },
    });
  } catch {
    return null;
  }
}

export async function getShopTimeClock(slug: string) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { slug },
      include: {
        staffMembers: {
          where: {
            isActive: true,
          },
          orderBy: { displayName: "asc" },
        },
      },
    });

    if (!shop) {
      return null;
    }

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    const [activeEntries, todayEntries, openOverrides] = await Promise.all([
      prisma.timeEntry.findMany({
        where: {
          shopId: shop.id,
          endedAt: null,
        },
        orderBy: { startedAt: "asc" },
        include: {
          staffMember: true,
        },
      }),
      prisma.timeEntry.findMany({
        where: {
          shopId: shop.id,
          startedAt: {
            gte: dayStart,
          },
        },
        orderBy: [{ startedAt: "desc" }],
        include: {
          staffMember: true,
        },
      }),
      prisma.timeEntry.findMany({
        where: {
          shopId: shop.id,
          endedAt: null,
          overrideReason: {
            not: null,
          },
        },
        orderBy: { startedAt: "asc" },
        include: {
          staffMember: true,
        },
      }),
    ]);

    return {
      shop,
      activeEntries,
      todayEntries,
      openOverrides,
    };
  } catch {
    return null;
  }
}

export async function getShopInventory(slug: string) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { slug },
      include: {
        inventoryItems: {
          orderBy: [{ category: "asc" }, { name: "asc" }, { color: "asc" }],
        },
        staffMembers: {
          where: {
            role: {
              in: ["OWNER", "MANAGER"],
            },
          },
          orderBy: { displayName: "asc" },
        },
      },
    });

    if (!shop) {
      return null;
    }

    const movements = await prisma.inventoryMovement.findMany({
      where: {
        shopId: shop.id,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        item: true,
        createdBy: true,
        order: true,
      },
    });

    return {
      shop,
      movements,
      summary: {
        totalItems: shop.inventoryItems.length,
        lowStockItems: shop.inventoryItems.filter((item) => item.quantityOnHand <= 12).length,
        useTodayItems: shop.inventoryItems.filter((item) => item.freshnessNote?.toLowerCase().includes("use today"))
          .length,
      },
    };
  } catch {
    return null;
  }
}

export async function getShopProcurement(slug: string) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { slug },
      include: {
        inventoryItems: {
          orderBy: [{ category: "asc" }, { name: "asc" }],
        },
        purchaseOrders: {
          orderBy: [{ createdAt: "desc" }],
          include: {
            lines: {
              include: {
                inventoryItem: true,
              },
              orderBy: { createdAt: "asc" },
            },
          },
          take: 20,
        },
      },
    });

    if (!shop) {
      return null;
    }

    return {
      shop,
      summary: {
        totalPurchaseOrders: shop.purchaseOrders.length,
        openPurchaseOrders: shop.purchaseOrders.filter((po) => !["RECEIVED", "CANCELLED"].includes(po.status)).length,
        partiallyReceived: shop.purchaseOrders.filter((po) => po.status === "PARTIALLY_RECEIVED").length,
      },
    };
  } catch {
    return null;
  }
}

export async function getShopProposals(slug: string) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { slug },
      include: {
        customers: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        proposals: {
          orderBy: [{ createdAt: "desc" }],
          include: {
            customer: true,
            lines: true,
          },
          take: 20,
        },
      },
    });

    if (!shop) {
      return null;
    }

    return {
      shop,
      summary: {
        totalProposals: shop.proposals.length,
        draftProposals: shop.proposals.filter((proposal) => proposal.status === "DRAFT").length,
        approvedProposals: shop.proposals.filter((proposal) => proposal.status === "APPROVED").length,
      },
    };
  } catch {
    return null;
  }
}

export async function getOrderDetail(shopSlug: string, orderNumber: string) {
  try {
    return await prisma.order.findFirst({
      where: {
        orderNumber,
        shop: { slug: shopSlug },
      },
      include: {
        shop: {
          include: {
            staffMembers: {
              where: {
                role: {
                  in: ["OWNER", "MANAGER", "DESIGNER"],
                },
              },
              orderBy: { displayName: "asc" },
            },
          },
        },
        customer: {
          include: {
            photos: {
              orderBy: { takenAt: "desc" },
              take: 3,
            },
          },
        },
        assignedDesigner: true,
        deliveryAddress: true,
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            checks: {
              include: {
                checkedBy: true,
              },
            },
          },
        },
        photos: {
          orderBy: { takenAt: "desc" },
        },
        delivery: {
          include: {
            driver: true,
            checks: {
              include: {
                orderItem: true,
                checkedBy: true,
              },
            },
          },
        },
      },
    });
  } catch {
    return null;
  }
}
