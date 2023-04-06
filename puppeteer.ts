import * as puppeteer from "puppeteer";

export const init = async() => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15"
  );

  return {page, browser };
}
