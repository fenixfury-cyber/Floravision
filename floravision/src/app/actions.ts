"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveImageUpload } from "@/lib/storage";
import {
  clearUserSession,
  createPasswordHash,
  createUserSession,
  requireCurrentSession,
  requireShopAccess,
  verifyPassword,
} from "@/lib/auth";
import { canHandleDeliveries, canManageOrders, canManageShop } from "@/lib/authorization";

type TransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function ensureUniqueSlug(baseSlug: string) {
  let candidate = baseSlug || "flower-shop";
  let suffix = 1;

  while (true) {
    const existing = await prisma.shop.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

export async function createShop(formData: FormData) {
  const session = await requireCurrentSession();

  if (session.user.platformRole !== "PLATFORM_ADMIN") {
    throw new Error("Only platform admins can create shops.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "America/Chicago").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const ownerEmail = String(formData.get("ownerEmail") ?? "").trim();
  const ownerPassword = String(formData.get("ownerPassword") ?? "").trim();

  if (!name || !ownerName || !ownerEmail || !ownerPassword) {
    throw new Error("Shop name, owner name, owner email, and owner password are required.");
  }

  const slug = await ensureUniqueSlug(slugify(name));
  const ownerPasswordHash = createPasswordHash(ownerPassword);

  const shop = await prisma.$transaction(async (tx: TransactionClient) => {
    const createdShop = await tx.shop.create({
      data: {
        slug,
        name,
        email: email || null,
        phone: phone || null,
        timezone: timezone || "America/Chicago",
      },
      select: {
        id: true,
        slug: true,
      },
    });

    const ownerUser = await tx.user.create({
      data: {
        name: ownerName,
        email: ownerEmail,
        passwordHash: ownerPasswordHash,
        platformRole: "USER",
      },
      select: {
        id: true,
      },
    });

    const ownerStaff = await tx.staffMember.create({
      data: {
        shopId: createdShop.id,
        firstName: ownerName.split(" ")[0] ?? ownerName,
        lastName: ownerName.split(" ").slice(1).join(" "),
        displayName: ownerName,
        email: ownerEmail || null,
        role: "OWNER",
      },
      select: {
        id: true,
      },
    });

    await tx.membership.create({
      data: {
        userId: ownerUser.id,
        shopId: createdShop.id,
        staffMemberId: ownerStaff.id,
        role: "OWNER",
        isDefault: true,
      },
    });

    return createdShop;
  });

  redirect(`/shops/${shop.slug}`);
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          shop: true,
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }

  await createUserSession(user.id);

  const targetShop = user.memberships[0]?.shop.slug;

  if (user.platformRole === "PLATFORM_ADMIN" || !targetShop) {
    redirect("/");
  }

  redirect(`/shops/${targetShop}`);
}

export async function logout() {
  await clearUserSession();
  redirect("/");
}

export async function updateOrderStatus(formData: FormData) {
  const shopSlug = String(formData.get("shopSlug") ?? "");
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const status = String(formData.get("status") ?? "");
  const access = await requireShopAccess(shopSlug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === shopSlug) ?? null;

  if (!canManageOrders(access.user.platformRole, membership?.role)) {
    throw new Error("You do not have permission to update order status.");
  }

  const order = await prisma.order.findFirst({
    where: {
      shop: { slug: shopSlug },
      orderNumber,
    },
    select: { id: true },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: status as
        | "DRAFT"
        | "CONFIRMED"
        | "DESIGNING"
        | "READY_FOR_PICKUP"
        | "OUT_FOR_DELIVERY"
        | "COMPLETED"
        | "CANCELLED",
    },
  });

  revalidatePath(`/shops/${shopSlug}`);
  revalidatePath(`/shops/${shopSlug}/orders/${orderNumber}`);
}

export async function assignOrderDesigner(formData: FormData) {
  const shopSlug = String(formData.get("shopSlug") ?? "");
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const designerId = String(formData.get("designerId") ?? "");
  const access = await requireShopAccess(shopSlug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === shopSlug) ?? null;

  if (!canManageOrders(access.user.platformRole, membership?.role)) {
    throw new Error("You do not have permission to assign designers.");
  }

  const [order, designer] = await Promise.all([
    prisma.order.findFirst({
      where: {
        shop: { slug: shopSlug },
        orderNumber,
      },
      select: { id: true },
    }),
    prisma.staffMember.findFirst({
      where: {
        id: designerId,
        shop: { slug: shopSlug },
      },
      select: { id: true },
    }),
  ]);

  if (!order || !designer) {
    throw new Error("Order or designer not found.");
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      assignedDesignerId: designer.id,
    },
  });

  revalidatePath(`/shops/${shopSlug}`);
  revalidatePath(`/shops/${shopSlug}/orders/${orderNumber}`);
}

export async function markDeliveryItemChecked(formData: FormData) {
  const shopSlug = String(formData.get("shopSlug") ?? "");
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const orderItemId = String(formData.get("orderItemId") ?? "");
  const access = await requireShopAccess(shopSlug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === shopSlug) ?? null;

  if (!canHandleDeliveries(access.user.platformRole, membership?.role)) {
    throw new Error("You do not have permission to handle delivery checks.");
  }

  const order = await prisma.order.findFirst({
    where: {
      shop: { slug: shopSlug },
      orderNumber,
    },
    include: {
      delivery: true,
    },
  });

  if (!order?.delivery) {
    throw new Error("Delivery record not found.");
  }

  const existing = await prisma.deliveryItemCheck.findFirst({
    where: {
      deliveryId: order.delivery.id,
      orderItemId,
    },
    select: { id: true },
  });

  if (!existing) {
    await prisma.deliveryItemCheck.create({
      data: {
        deliveryId: order.delivery.id,
        orderItemId,
        checkedById: membership?.staffMemberId ?? null,
        note: "Checked from order detail screen.",
      },
    });
  }

  revalidatePath(`/shops/${shopSlug}/orders/${orderNumber}`);
}

export async function updateCustomerNotes(formData: FormData) {
  const shopSlug = String(formData.get("shopSlug") ?? "");
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const customerId = String(formData.get("customerId") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const access = await requireShopAccess(shopSlug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === shopSlug) ?? null;

  if (!canManageOrders(access.user.platformRole, membership?.role)) {
    throw new Error("You do not have permission to update customer notes.");
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: { notes },
  });

  revalidatePath(`/shops/${shopSlug}/orders/${orderNumber}`);
}

export async function updateOrderNotes(formData: FormData) {
  const shopSlug = String(formData.get("shopSlug") ?? "");
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const orderId = String(formData.get("orderId") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const internalSummary = String(formData.get("internalSummary") ?? "");
  const access = await requireShopAccess(shopSlug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === shopSlug) ?? null;

  if (!canManageOrders(access.user.platformRole, membership?.role)) {
    throw new Error("You do not have permission to update order notes.");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      notes,
      internalSummary,
    },
  });

  revalidatePath(`/shops/${shopSlug}`);
  revalidatePath(`/shops/${shopSlug}/orders/${orderNumber}`);
}

export async function addOrderPhoto(formData: FormData) {
  const shopSlug = String(formData.get("shopSlug") ?? "");
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const orderId = String(formData.get("orderId") ?? "");
  const customerId = String(formData.get("customerId") ?? "");
  const imageUrlInput = String(formData.get("imageUrl") ?? "").trim();
  const imageFile = formData.get("imageFile");
  const caption = String(formData.get("caption") ?? "").trim();
  const kind = String(formData.get("kind") ?? "ARRANGEMENT");
  const access = await requireShopAccess(shopSlug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === shopSlug) ?? null;

  if (!canManageOrders(access.user.platformRole, membership?.role)) {
    throw new Error("You do not have permission to attach photos.");
  }

  const uploadedFile = imageFile instanceof File && imageFile.size > 0 ? imageFile : null;

  if (!uploadedFile && !imageUrlInput) {
    throw new Error("Provide either an image file or an image URL.");
  }

  const imageUrl = uploadedFile
    ? await saveImageUpload(uploadedFile, ["orders", shopSlug, orderNumber])
    : imageUrlInput;

  await prisma.orderPhoto.create({
    data: {
      orderId,
      customerId: customerId || null,
      capturedById: membership?.staffMemberId ?? null,
      kind: kind as "ARRANGEMENT" | "COMPONENT_PROOF" | "DELIVERY_PROOF",
      imageUrl,
      caption: caption || null,
    },
  });

  revalidatePath(`/shops/${shopSlug}/orders/${orderNumber}`);
}

export async function clockInStaff(formData: FormData) {
  const shopSlug = String(formData.get("shopSlug") ?? "");
  const staffMemberId = String(formData.get("staffMemberId") ?? "");
  const access = await requireShopAccess(shopSlug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === shopSlug) ?? null;

  if (!canManageOrders(access.user.platformRole, membership?.role)) {
    throw new Error("You do not have permission to clock in staff.");
  }

  const existingOpenEntry = await prisma.timeEntry.findFirst({
    where: {
      shop: { slug: shopSlug },
      staffMemberId,
      endedAt: null,
    },
    select: { id: true },
  });

  if (!existingOpenEntry) {
    await prisma.timeEntry.create({
      data: {
        shop: {
          connect: { slug: shopSlug },
        },
        staffMember: {
          connect: { id: staffMemberId },
        },
        startedAt: new Date(),
      },
    });
  }

  revalidatePath(`/shops/${shopSlug}/time-clock`);
  revalidatePath(`/shops/${shopSlug}`);
}

export async function clockOutStaff(formData: FormData) {
  const shopSlug = String(formData.get("shopSlug") ?? "");
  const timeEntryId = String(formData.get("timeEntryId") ?? "");
  const access = await requireShopAccess(shopSlug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === shopSlug) ?? null;

  if (!canManageOrders(access.user.platformRole, membership?.role)) {
    throw new Error("You do not have permission to clock out staff.");
  }

  await prisma.timeEntry.update({
    where: { id: timeEntryId },
    data: {
      endedAt: new Date(),
      overrideReason: null,
    },
  });

  revalidatePath(`/shops/${shopSlug}/time-clock`);
  revalidatePath(`/shops/${shopSlug}`);
}

export async function resolveTimeEntryOverride(formData: FormData) {
  const shopSlug = String(formData.get("shopSlug") ?? "");
  const timeEntryId = String(formData.get("timeEntryId") ?? "");
  const endedAt = String(formData.get("endedAt") ?? "");
  const overrideReason = String(formData.get("overrideReason") ?? "").trim();
  const access = await requireShopAccess(shopSlug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === shopSlug) ?? null;

  if (!membership || !["OWNER", "MANAGER"].includes(membership.role) && access.user.platformRole !== "PLATFORM_ADMIN") {
    throw new Error("You do not have permission to resolve time clock exceptions.");
  }

  await prisma.timeEntry.update({
    where: { id: timeEntryId },
    data: {
      endedAt: endedAt ? new Date(endedAt) : new Date(),
      overrideReason: overrideReason || "Manager override",
    },
  });

  revalidatePath(`/shops/${shopSlug}/time-clock`);
  revalidatePath(`/shops/${shopSlug}`);
}

export async function receiveInventory(formData: FormData) {
  const shopSlug = String(formData.get("shopSlug") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const note = String(formData.get("note") ?? "").trim();
  const freshnessNote = String(formData.get("freshnessNote") ?? "").trim();
  const access = await requireShopAccess(shopSlug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === shopSlug) ?? null;

  if (!canManageShop(access.user.platformRole, membership?.role)) {
    throw new Error("You do not have permission to receive inventory.");
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  await prisma.$transaction(async (tx: TransactionClient) => {
    await tx.inventoryItem.update({
      where: { id: itemId },
      data: {
        quantityOnHand: {
          increment: quantity,
        },
        ...(freshnessNote ? { freshnessNote } : {}),
      },
    });

    await tx.inventoryMovement.create({
      data: {
        shop: {
          connect: { slug: shopSlug },
        },
        item: {
          connect: { id: itemId },
        },
        createdBy: membership?.staffMemberId ? { connect: { id: membership.staffMemberId } } : undefined,
        type: "RECEIPT",
        quantity,
        note: note || "Inventory received",
      },
    });
  });

  revalidatePath(`/shops/${shopSlug}/inventory`);
  revalidatePath(`/shops/${shopSlug}`);
}

export async function logInventoryAdjustment(formData: FormData) {
  const shopSlug = String(formData.get("shopSlug") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const type = String(formData.get("type") ?? "MANUAL_ADJUSTMENT");
  const note = String(formData.get("note") ?? "").trim();
  const access = await requireShopAccess(shopSlug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === shopSlug) ?? null;

  if (!canManageShop(access.user.platformRole, membership?.role)) {
    throw new Error("You do not have permission to log inventory changes.");
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  const signedQuantity = type === "WASTE" ? -Math.abs(quantity) : quantity;

  await prisma.$transaction(async (tx: TransactionClient) => {
    await tx.inventoryItem.update({
      where: { id: itemId },
      data: {
        quantityOnHand: {
          increment: signedQuantity,
        },
      },
    });

    await tx.inventoryMovement.create({
      data: {
        shop: {
          connect: { slug: shopSlug },
        },
        item: {
          connect: { id: itemId },
        },
        createdBy: membership?.staffMemberId ? { connect: { id: membership.staffMemberId } } : undefined,
        type: type as "WASTE" | "MANUAL_ADJUSTMENT",
        quantity: signedQuantity,
        note: note || (type === "WASTE" ? "Waste logged" : "Manual adjustment"),
      },
    });
  });

  revalidatePath(`/shops/${shopSlug}/inventory`);
  revalidatePath(`/shops/${shopSlug}`);
}

export async function createPurchaseOrder(formData: FormData) {
  const shopSlug = String(formData.get("shopSlug") ?? "");
  const poNumber = String(formData.get("poNumber") ?? "").trim();
  const vendorName = String(formData.get("vendorName") ?? "").trim();
  const expectedAt = String(formData.get("expectedAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const itemId = String(formData.get("itemId") ?? "");
  const orderedQuantity = Number(formData.get("orderedQuantity") ?? 0);
  const unitCostCents = Number(formData.get("unitCostCents") ?? 0);
  const access = await requireShopAccess(shopSlug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === shopSlug) ?? null;

  if (!canManageShop(access.user.platformRole, membership?.role)) {
    throw new Error("You do not have permission to create purchase orders.");
  }

  if (!poNumber || !vendorName || !itemId || !Number.isFinite(orderedQuantity) || orderedQuantity <= 0) {
    throw new Error("Purchase order number, vendor, item, and quantity are required.");
  }

  const shop = await prisma.shop.findUnique({
    where: { slug: shopSlug },
    select: { id: true },
  });

  if (!shop) {
    throw new Error("Shop not found.");
  }

  await prisma.purchaseOrder.create({
    data: {
      shopId: shop.id,
      poNumber,
      vendorName,
      status: "ORDERED",
      expectedAt: expectedAt ? new Date(expectedAt) : null,
      notes: notes || null,
      lines: {
        create: {
          inventoryItemId: itemId,
          description: "Initial line item",
          orderedQuantity,
          unitCostCents: Number.isFinite(unitCostCents) && unitCostCents > 0 ? unitCostCents : null,
        },
      },
    },
  });

  revalidatePath(`/shops/${shopSlug}/procurement`);
}

export async function receivePurchaseOrderLine(formData: FormData) {
  const shopSlug = String(formData.get("shopSlug") ?? "");
  const purchaseOrderId = String(formData.get("purchaseOrderId") ?? "");
  const purchaseOrderLineId = String(formData.get("purchaseOrderLineId") ?? "");
  const receivedQuantity = Number(formData.get("receivedQuantity") ?? 0);
  const note = String(formData.get("note") ?? "").trim();
  const access = await requireShopAccess(shopSlug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === shopSlug) ?? null;

  if (!canManageShop(access.user.platformRole, membership?.role)) {
    throw new Error("You do not have permission to receive purchase order items.");
  }

  if (!Number.isFinite(receivedQuantity) || receivedQuantity <= 0) {
    throw new Error("Received quantity must be greater than zero.");
  }

  await prisma.$transaction(async (tx: TransactionClient) => {
    const line = await tx.purchaseOrderLine.findUnique({
      where: { id: purchaseOrderLineId },
      include: {
        purchaseOrder: true,
      },
    });

    if (!line || line.purchaseOrderId !== purchaseOrderId) {
      throw new Error("Purchase order line not found.");
    }

    await tx.purchaseOrderLine.update({
      where: { id: purchaseOrderLineId },
      data: {
        receivedQuantity: {
          increment: receivedQuantity,
        },
      },
    });

    await tx.inventoryItem.update({
      where: { id: line.inventoryItemId },
      data: {
        quantityOnHand: {
          increment: receivedQuantity,
        },
      },
    });

    await tx.inventoryMovement.create({
      data: {
        shop: {
          connect: { slug: shopSlug },
        },
        item: {
          connect: { id: line.inventoryItemId },
        },
        purchaseOrderLine: {
          connect: { id: purchaseOrderLineId },
        },
        createdBy: membership?.staffMemberId ? { connect: { id: membership.staffMemberId } } : undefined,
        type: "RECEIPT",
        quantity: receivedQuantity,
        note: note || `Received against PO ${line.purchaseOrder.poNumber}`,
      },
    });

    const refreshedLines = await tx.purchaseOrderLine.findMany({
      where: {
        purchaseOrderId,
      },
      select: {
        orderedQuantity: true,
        receivedQuantity: true,
      },
    });

    const isFullyReceived = refreshedLines.every((entry) => entry.receivedQuantity >= entry.orderedQuantity);
    const hasAnyReceived = refreshedLines.some((entry) => entry.receivedQuantity > 0);

    await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        status: isFullyReceived ? "RECEIVED" : hasAnyReceived ? "PARTIALLY_RECEIVED" : "ORDERED",
      },
    });
  });

  revalidatePath(`/shops/${shopSlug}/procurement`);
  revalidatePath(`/shops/${shopSlug}/inventory`);
}

export async function createProposal(formData: FormData) {
  const shopSlug = String(formData.get("shopSlug") ?? "");
  const proposalNumber = String(formData.get("proposalNumber") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "OTHER");
  const customerId = String(formData.get("customerId") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const lineDescription = String(formData.get("lineDescription") ?? "").trim();
  const lineQuantity = Number(formData.get("lineQuantity") ?? 0);
  const lineUnitPrice = Number(formData.get("lineUnitPrice") ?? 0);
  const access = await requireShopAccess(shopSlug);
  const membership = access.user.memberships.find((entry) => entry.shop.slug === shopSlug) ?? null;

  if (!canManageShop(access.user.platformRole, membership?.role)) {
    throw new Error("You do not have permission to create proposals.");
  }

  if (!proposalNumber || !title || !lineDescription || !Number.isFinite(lineQuantity) || lineQuantity <= 0) {
    throw new Error("Proposal number, title, and at least one valid line item are required.");
  }

  const shop = await prisma.shop.findUnique({
    where: { slug: shopSlug },
    select: { id: true },
  });

  if (!shop) {
    throw new Error("Shop not found.");
  }

  await prisma.proposal.create({
    data: {
      shopId: shop.id,
      customerId: customerId || null,
      proposalNumber,
      title,
      type: type as "WEDDING" | "FUNERAL" | "PARTY" | "CORPORATE" | "OTHER",
      eventDate: eventDate ? new Date(eventDate) : null,
      venue: venue || null,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      notes: notes || null,
      lines: {
        create: {
          description: lineDescription,
          quantity: lineQuantity,
          unitPrice: Number.isFinite(lineUnitPrice) && lineUnitPrice > 0 ? lineUnitPrice : 0,
        },
      },
    },
  });

  revalidatePath(`/shops/${shopSlug}/proposals`);
}
