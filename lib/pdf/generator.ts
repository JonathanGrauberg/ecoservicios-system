import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium-min"

// 👇 versión válida confirmada
const CHROMIUM_REMOTE_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v119.0.0/chromium-v119.0.0-pack.tar"

export async function generatePdf(html: string): Promise<Uint8Array> {
  const isDev = process.env.NODE_ENV !== "production"

  const executablePath = isDev
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : await chromium.executablePath(CHROMIUM_REMOTE_URL)

  const browser = await puppeteer.launch({
    args: isDev
      ? []
      : [
          ...chromium.args,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
    executablePath,
    headless: true, // 👈 fijo, sin depender de chromium
  })

  const page = await browser.newPage()

  await page.setContent(html, {
    waitUntil: "domcontentloaded", // 👈 clave
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