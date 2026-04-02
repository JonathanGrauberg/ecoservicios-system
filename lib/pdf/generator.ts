import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"

export async function generatePdf(html: string): Promise<Uint8Array> {
  const isDev = process.env.NODE_ENV !== "production"

  const executablePath = isDev
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : await chromium.executablePath()

  const browser = await puppeteer.launch({
    args: isDev
      ? []
      : [
          ...chromium.args,
          "--no-sandbox",
          "--disable-setuid-sandbox",
        ],
    executablePath,
    headless: true, // 👈 simple y compatible
  })

  const page = await browser.newPage()

  await page.setContent(html, {
    waitUntil: "domcontentloaded", // 👈 clave para Vercel
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