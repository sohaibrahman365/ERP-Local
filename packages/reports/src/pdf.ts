import puppeteer from "puppeteer";
import Handlebars from "handlebars";

export async function generatePDF(
  templateHtml: string,
  data: Record<string, unknown>,
  options?: { landscape?: boolean; format?: string }
): Promise<Buffer> {
  const template = Handlebars.compile(templateHtml);
  const html = template(data);

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: (options?.format as "A4") ?? "A4",
    landscape: options?.landscape ?? false,
    printBackground: true,
    margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
  });

  await browser.close();
  return Buffer.from(pdf);
}
