import { init } from "./puppeteer";
import { login, getCookies } from "./auth";
import { sleep } from "./helpers";
import { formatTxns  } from "./helpers";
import { Decimal128 } from "mongodb";

export const scrapOkra = async(db) => {
  const { page, browser } = await init();

  const isSession = await getCookies(process.env.AUTH_EMAIL, page);
  let authId;
  if (!isSession) {
    authId = await login(page, db);
  }

  const customer = await getCustomerDetails(page, authId);
  const insertedCustomer = await db.collection("ledger_customers").insertOne(customer);
  await getAccounts(page,db, insertedCustomer.insertedId);

  // finnally logut and close
  await logOut(page);
  await browser.close();

}

const getCustomerDetails = async(page, auth) => {
  const [nameElement]:any = await page.$x('//main/div/h1');
  let name = "";
  if (nameElement) {
    name =
      (await page.evaluate((element: any) => element.textContent, nameElement)) ||
      "";
  }
  const profileElements = await page.$x('//main//div/p/span/parent::p');
  const profileDetails = await page.evaluate((...profileElements) => {
    return profileElements.map(e => e.textContent)
  }, ...profileElements)
  
  name = name.split("Welcome back")[1].replace("!","").trim();
  const [firstName, lastName] = name.split(" ");
  const customer = {
    firstName,
    lastName,
    bank: "Okra",
    createdAt: new Date(),
    updatedAt: new Date(),
    auth
  }
  const detailsMapper = {
    0: "address",
    1: "bvn",
    2: "phone",
    3: "email"
  }
  for(let i = 0; i < profileDetails.length; i++){
    customer[`${detailsMapper[i]}`] = profileDetails[i].split(':')[1].trim()
  }
  
  return customer;
}

const getAccounts = async(page,db, user) => {
  const accountLinks: any = await page.$x('//a[contains(text(),"View Account")]');
  const accounts: {
    accountNo: string;
    accountType: string;
    currency: string;
    availableBalance: Decimal128;
    ledgerBalance: Decimal128;
  }[] = [];

  for(let i=0; i < accountLinks.length; i++){
    const links: any = await page.$x('//a[contains(text(),"View Account")]');
    let accountNo: string = await page.evaluate(
      (element: any) => element.href || "",
      links[i]
    );
    [,accountNo] = accountNo.split("-");
    
    await links[i].click();
    await page.waitForXPath('//h2[@class="sr-only" and contains(text(), "Account")]/following::h3[1]');
 
    const [accountTypeElement] = await page.$x('//h2[@class="sr-only" and contains(text(), "Account")]/following::h3[1]');
    const accountType: string = await page.evaluate(
      (element: any) => element.textContent,
      accountTypeElement
    );

    const [balanceElement] = await page.$x('//h2[@class="sr-only" and contains(text(), "Account")]/following::p[1]');
    const balance:string = await page.evaluate(
      (element: any) => element.textContent,
      balanceElement
    );
    const [currency, availableBalance]: string[] = balance.split(" ");

    const [ledgerElement] = await page.$x('//h2[@class="sr-only" and contains(text(), "Account")]/following::p[2]');
    const ledger = await page.evaluate(
      (element: any) => element.textContent,
      ledgerElement
    );
    const [,ledgerBalance,]: string = ledger.split(" ");
    
    const account = {
      accountNo,
      accountType,
      currency,
      availableBalance: new Decimal128(availableBalance),
      ledgerBalance: new Decimal128(ledgerBalance),
      user,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    accounts.push(account);

    await db.collection("ledger_accounts").dropIndexes()
    const insertedAccount = await db.collection("ledger_accounts").insertOne(account);
    const transactions = await getTransactions(page);
    const formattedTxns = formatTxns(transactions, insertedAccount.insertedId);
    await db.collection("ledger_transactions").insertMany(formattedTxns);

    await page.goBack();
    await sleep(3000);
    await page.waitForXPath('//a[contains(text(),"View Account")]');
  }

  return accounts
}

const getTransactions = async(page) => {
  let transactions = [];

  const txns = await getOnePageTxns(page);
  transactions = transactions.concat(txns);

  await page.waitForXPath('//button[contains(text(),"Next")]');
  const [nextButton] = await page.$x('//button[contains(text(),"Next")]');

  while(true){
    const [maxCurrentElement] = await page.$x('//button[contains(text(),"Next")]/preceding::span[2]');
    const maxCurrent = await page.evaluate(
      (element: any) => element.textContent,
      maxCurrentElement
    ) || "";
    const [totalElement] = await page.$x('//button[contains(text(),"Next")]/preceding::span[1]');
    const total = await page.evaluate(
      (element: any) => element.textContent,
      totalElement
    ) || "";

    if((await page.$x('//button[contains(text(),"Next")]')).length > 0 && parseInt(maxCurrent) < parseInt(total) ){
      await nextButton.click();
      await page.waitForXPath('//td[contains(text(),"₦")]');
      const txns = await getOnePageTxns(page);
      transactions = transactions.concat(txns);
    } else {
      break;
    }
 
  }
  transactions = transactions.filter(transaction => transaction.length > 0);
  return transactions;
}

const getOnePageTxns = async (page)=> {
  const result = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    return Array.from(rows, row => {
      const columns = row.querySelectorAll('td, th');
      return Array.from(columns, (column: any) => column.innerText);
    });
  });
  return result;
}

const logOut = async(page) => {
  const [logOutLink] = await page.$x('//a[contains(text(), "Sign out")]');
  await logOutLink.click();
};