import { NextResponse } from "next/server";

export async function GET() {
  // pozn.: všechno dělám uvnitř GETu, aby se Prisma načítala až při requestu
  // (když ji importuju nahoře, spadne to, pokud ještě nebyl vygenerovaný klient)
  try {
    try {
      // pozn.: importuju Prisma jen dynamicky – tím se vyhnu chybě při startu serveru
      const prismaPkg = await import("@prisma/client");
      const { PrismaClient } = prismaPkg as { PrismaClient: any };
      const client = new PrismaClient();

      try {
        // pozn.: tady fakt načtu data z DB (model parkingHouse)
        const data = await client.parkingHouse.findMany();

        // pozn.: po dotazu DB odpojím, aby nezůstalo viset připojení
        await client.$disconnect().catch(() => {});

        // pozn.: pošlu data jako JSON
        return NextResponse.json(data);
      } finally {
        // pozn.: jistota – ať se vždycky odpojí i když by nahoře něco spadlo
        await client.$disconnect().catch(() => {});
      }
    } catch (dbErr) {
      // pozn.: kdyby nešla DB nebo Prisma klient, vrátím fallback data (aby to něco ukázalo)
      console.error("/api/parkinglots DB load error, returning fallback:", dbErr);
      const fallback = [
        { id: "1", name: "Central Parking", location: "123 Main St", capacity: 150 },
        { id: "2", name: "Riverside Garage", location: "45 River Rd", capacity: 80 },
      ];
      return NextResponse.json({ fallback }, { status: 200 });
    }
  } catch (err) {
    // pozn.: úplně neočekávaná chyba – jen vypíšu a vrátím 500
    console.error("/api/parkinglots unexpected error:", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
