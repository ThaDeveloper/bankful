export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

interface ITransaction {
  ledgerType: string;
  date: string;
  description: string;
  txnType: string;
  amount: string;
  currency: string;
  beneficiary: string;
  sender: string;
};

export const formatTxns = (txns: string[][]): ITransaction[] => {
  const transactions: ITransaction[] = [];
  for(const txn of txns){
    const [ledgerType, date, description, amount, beneficiary, sender]: string[] = txn;
    const [txnType] = description.split(" ");
    const currency = amount.slice(0, 1);
    const amountValue = amount.slice(1);
    transactions.push({ledgerType, date, description,txnType, amount: amountValue, currency, beneficiary, sender});
  }

  return transactions;
};
