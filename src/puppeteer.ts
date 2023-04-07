import * as puppeteer from "puppeteer";

export const init = async() => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--start-maximized", "--no-sandbox", "--disable-setuid-sandbox"],
    timeout: 0
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768});
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15"
  );

  return {page, browser };
}
