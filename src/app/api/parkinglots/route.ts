import { NextResponse } from "next/server";

// ---------------------------
// GET → vypíše všechna parkoviště z databáze
// ---------------------------
export async function GET() {
  try {
    // dynamický import Prisma (načte se až při požadavku)
    const prismaPkg = await import("@prisma/client");
    const { PrismaClient } = prismaPkg as { PrismaClient: typeof import("@prisma/client").PrismaClient };
    const client = new PrismaClient();

    try {
      // z databáze vytáhne všechny záznamy z tabulky parkingHouse
      const data = await client.parkingHouse.findMany();

      // vrátí JSON odpověď (200 OK)
      return NextResponse.json(data);
    } finally {
      // odpojí se od databáze (aby nezůstalo viset připojení)
      await client.$disconnect().catch(() => {});
    }

  } catch (err) {
    // když spadne připojení nebo DB nefunguje → vypíše chybu
    console.error("/api/parkinglots GET error:", err);

    // pošle „náhradní“ data (aby endpoint aspoň něco vrátil)
    const fallback = [
      { id: "1", name: "Central Parking", location: "123 Main St", capacity: 150 },
      { id: "2", name: "Riverside Garage", location: "45 River Rd", capacity: 80 },
    ];
    return NextResponse.json({ fallback }, { status: 200 });
  }
}

// ---------------------------
// POST → vytvoří nové parkoviště v databázi
// ---------------------------
export async function POST(req: Request) {
  try {
    // přečte JSON tělo z requestu (data, co posílá klient)
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      // když tělo není validní JSON → vrátí chybu
      return NextResponse.json({ error: "Body is not valid JSON" }, { status: 400 });
    }

    // převede body na objekt (abychom z něj mohli číst hodnoty)
    const parsedBody = (body ?? {}) as Record<string, unknown>;
    const { adminId, address, price } = parsedBody;

    // --- základní kontrola dat (validace) ---
    // ověří, jestli adminId je 24znakové MongoID
    const isValidObjectId = (v: unknown) => typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);
    if (!isValidObjectId(adminId) || typeof address !== "string" || address.trim() === "") {
      return NextResponse.json({ error: "Missing or invalid adminId/address" }, { status: 400 });
    }

    // převede hodnoty na stringy/čísla
    const adminIdStr = adminId as string;
    const addressStr = (address as string).trim();

    // převede cenu na číslo a ověří, že je platná
    const parsedPrice = typeof price === "number" ? price : Number(price);
    if (!Number.isFinite(parsedPrice) || !Number.isInteger(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "Missing or invalid price (must be a non-negative integer)" }, { status: 400 });
    }

    // znovu dynamicky načte Prisma klienta (připojení k DB)
    const prismaPkg = await import("@prisma/client");
    const { PrismaClient } = prismaPkg as { PrismaClient: typeof import("@prisma/client").PrismaClient };
    const client = new PrismaClient();

    try {
      // ověří, že adminId v DB opravdu existuje (aby se zachovala vazba)
      const admin = await client.admin.findUnique({ where: { id: adminIdStr } });
      if (!admin) {
        return NextResponse.json({ error: "adminId does not exist" }, { status: 400 });
      }

      // vytvoří nový záznam v tabulce parkingHouse
      const created = await client.parkingHouse.create({
        data: { adminId: adminIdStr, address: addressStr, price: parsedPrice },
      });

      // vrátí nově vytvořené parkoviště (201 = Created)
      return NextResponse.json(created, { status: 201 });

    } catch (e: unknown) {
      // když adresa už existuje (unikátní klíč), Prisma vrátí chybu P2002
      const code = (e as { code?: string })?.code;
      if (code === "P2002") {
        return NextResponse.json({ error: "Parking lot with this address already exists" }, { status: 409 });
      }

      // jiná chyba v databázi
      console.error("/api/parkinglots POST db error:", e);
      return NextResponse.json({ error: "Failed to create parking lot" }, { status: 500 });
    } finally {
      // odpojí se od databáze
      await client.$disconnect().catch(() => {});
    }

  } catch (err) {
    // zachytí úplně nečekané chyby (např. pád serveru)
    console.error("/api/parkinglots POST error:", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}