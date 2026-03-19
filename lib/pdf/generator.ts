import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"

export async function generatePdf(html: string): Promise<Uint8Array> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  })

  const page = await browser.newPage()

  await page.setContent(html, {
    waitUntil: "networkidle0",
  })

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  })

  await browser.close()

  return pdf
}