import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { budgetPdfTemplate } from "@/lib/pdf/template"
import { generatePdf } from "@/lib/pdf/generator"
import fs from "fs/promises"
import path from "path"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        client: true,
        items: {
          include: {
            productService: true
          }
        }
      }
    })

    if (!budget) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    /* ========================
       Cargar logos desde /public
       ======================== */

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ecoservicios-system.vercel.app"

    const logoDataUri = `${baseUrl}/logo-ecoservicios.png`
    const watermarkDataUri = `${baseUrl}/logo-watermark.png`

    /* ========================
       Generar HTML
       ======================== */

    const html = budgetPdfTemplate(budget, {
      logoDataUri,
      watermarkDataUri
    })

    const pdfUint8 = await generatePdf(html)
    const buffer = Buffer.from(pdfUint8)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=presupuesto-${id.slice(0, 6)}.pdf`
      }
    })

  } catch (error) {
    console.error("PDF error:", error)

    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    )
  }
}