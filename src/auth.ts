import * as dotenv from "dotenv";
import { sleep } from "./helpers";
import * as jsonfile from "jsonfile";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const user = {
  email: process.env.AUTH_EMAIL,
  password: process.env.AUTH_PASSWORD,
  otp: process.env.AUTH_OTP
};
const baseDir: string = path.join(__dirname, "../cookies/");


export const login = async(page) => {
  await doLogin(page);
  await setCookies(user.email, page);
}

export const doLogin = async(page) => {

  try {
  await page.goto("https://bankof.okra.ng/login", {
    waitUntil: "networkidle0",
  });

  // login
  await page.type('input[id="email"]', user.email);
  await page.type('input[id="password"]', user.password);
  await page.click('button[type="submit"]');

  page.on('dialog', async dialog => {
    await dialog.accept();
});

await page.waitForSelector('input[id="otp"]', {visible: true });
await page.type('input[id="otp"]', user.otp);
await page.click('button[type="submit"]');
await sleep(3000)

await page.waitForXPath('//a[contains(text(),"View Account")]');

  } catch(e){
    console.log("ERROR:",e);
  }
}

export const setCookies = async (email: string, page: any): Promise<any> => {
  try {
    // const cookiesObject = await page.cookies("https://bankof.okra.ng/dashboard")
    // const cookiesObject = await page.client.send('Network.getAllCookies');
    const client = await page.target().createCDPSession();
   const cookiesObject = (await client.send('Network.getAllCookies')).cookies;
    console.log("COOKES",cookiesObject);
    const filePath = `${baseDir}${email}.json`;
    const mkdirp = (dir: string) => {
      if (fs.existsSync(dir)) {
        return true;
      }
      const dirname = path.dirname(dir);
      mkdirp(dirname);
      fs.mkdirSync(dir);
      return;
    };
    mkdirp(baseDir);
    jsonfile.writeFile(
      filePath,
      cookiesObject,
      { spaces: 2 },
      async (err: any) => {
        if (err) {
          console.log("Cookie file could not be written.", err);
        }
      }
    );
  } catch (e) {
    console.log(e);
  }
};

export const getCookies = async (email: string, page: any): Promise<any> => {
  const previousSession = fs.existsSync(`${baseDir}${email}.json`);
  if (previousSession) {
    // If file exist load the cookies
    const cookiesArr = require(`${baseDir}${email}`);
    if (cookiesArr.length !== 0) {
      for (const cookie of cookiesArr) {
        await page.setCookie(cookie);
      }
      console.log("Session has been loaded in the browser");
      return true;
    }
  }
};