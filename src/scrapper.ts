import { init } from "./puppeteer";
import { login, getCookies } from "./auth";

export const scrapOkra = async() => {
  const { page, browser } = await init();

  const isSession = await getCookies(process.env.AUTH_EMAIL, page);
  if (!isSession) {
    await login();
  }
  await browser.close();

}