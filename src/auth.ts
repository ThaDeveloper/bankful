import * as dotenv from "dotenv";
import { sleep } from "./helpers";
import * as jsonfile from "jsonfile";
import * as fs from "fs";
import * as path from "path";

dotenv.config();


const baseDir: string = path.join(__dirname, "../cookies/");


export const login = async(page,db) => {
  const auth = await doLogin(page, db);
  await setCookies(auth.email, page);
  return auth._id;
}

export const doLogin = async(page, db) => {

  try {
    
    const [auth] = await db.collection("ledger_auths").find({}).toArray();
    const password = Buffer.from(auth.password, "base64").toString("ascii")

    await page.goto("https://bankof.okra.ng/login", {
      waitUntil: "networkidle0",
    });

    // login
    await page.type('input[id="email"]', auth.email);
    await page.type('input[id="password"]', password);
    await page.click('button[type="submit"]');

    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.waitForSelector('input[id="otp"]', {visible: true });
    await page.type('input[id="otp"]', auth.otp);
    await page.click('button[type="submit"]');
    await sleep(3000)

    await page.waitForXPath('//a[contains(text(),"View Account")]');
    return auth;

  } catch(e){
    console.log("ERROR:",e);
  }
}

export const setCookies = async (email: string, page: any): Promise<any> => {
  try {
    const cookiesObject = await page.cookies("https://bankof.okra.ng/dashboard");
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