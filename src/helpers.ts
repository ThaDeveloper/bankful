import { Decimal128, ObjectId } from "mongodb";

export const sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

interface ITransaction {
    ledgerType: string;
    clearedDate: Date;
    description: string;
    txnType: string;
    amount: Decimal128;
    currency: string;
    beneficiary: string;
    sender: string;
    account: ObjectId;
    createdAt: Date;
}

export const formatTxns = (txns: string[][], account: ObjectId): ITransaction[] => {
    const transactions: ITransaction[] = [];
    for (const txn of txns) {
        const [ledgerType, date, description, amount, beneficiary, sender]: string[] = txn;
        const [txnType] = description.split(" ");
        const currency = amount.slice(0, 1);
        const amountValue = amount.slice(1);
        transactions.push({
            ledgerType,
            clearedDate: new Date(date),
            description,
            txnType,
            amount: new Decimal128(amountValue),
            currency,
            beneficiary,
            sender,
            account,
            createdAt: new Date()
        });
    }

    return transactions;
};
