import { CategoryKey } from '../constants/theme';

export interface SMSParseResult {
  amount: number;
  merchant: string;
  category: CategoryKey;
  bank: string;
  type: 'debit' | 'credit' | 'unknown';
  rawSMS: string;
}

export function parseSMS(sms: string): SMSParseResult | null {
  const text = sms.trim();
  if (!text) return null;

  const isDebit  = /debited|debit|spent|paid|payment|sent|transferred out/i.test(text);
  const isCredit = /credited|credit|received|deposited/i.test(text);
  const type = isDebit ? 'debit' : isCredit ? 'credit' : 'unknown';

  let amount = 0;
  const amountPatterns = [
    /(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr|₹)/i,
    /(?:amount|amt)[:\s]+(?:rs\.?|₹|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ];
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (num > 0 && num < 1000000) { amount = num; break; }
    }
  }
  if (!amount) return null;

  let merchant = '';
  const upiPatterns = [
    /to\s+(?:vpa\s+)?([a-zA-Z0-9\s@._-]+?)(?:\s+on|\s+ref|\s+upi|\.|\n|$)/i,
    /at\s+([a-zA-Z0-9\s]+?)(?:\s+on|\s+ref|\.|,|\n|$)/i,
    /paid\s+to\s+([a-zA-Z0-9\s@._-]+?)(?:\s+on|\s+via|\.|,|\n|$)/i,
  ];
  for (const pattern of upiPatterns) {
    const match = text.match(pattern);
    if (match && match[1].trim().length > 2) {
      merchant = match[1].trim().replace(/@\w+/g, '').trim();
      if (merchant.length > 2) break;
    }
  }
  if (!merchant) merchant = 'Unknown merchant';

  const bankPatterns: Record<string, RegExp> = {
    'HDFC Bank':  /hdfc/i,
    'SBI':        /sbi|state bank/i,
    'ICICI Bank': /icici/i,
    'Axis Bank':  /axis/i,
    'Kotak Bank': /kotak/i,
    'PhonePe':    /phonepe/i,
    'Google Pay': /gpay|google pay/i,
    'Paytm':      /paytm/i,
  };
  let bank = 'Unknown';
  for (const [name, pattern] of Object.entries(bankPatterns)) {
    if (pattern.test(text)) { bank = name; break; }
  }

  const categoryKeywords: Record<CategoryKey, string[]> = {
    food:      ['swiggy','zomato','pizza','burger','cafe','restaurant','food','kitchen','hotel','bakery','dunzo'],
    transport: ['uber','ola','rapido','petrol','fuel','parking','toll','metro','irctc','redbus'],
    shopping:  ['amazon','flipkart','myntra','dmart','bigbasket','reliance','meesho','nykaa'],
    bills:     ['airtel','jio','vi','bsnl','electricity','internet','broadband','recharge'],
    health:    ['apollo','medplus','1mg','pharmeasy','hospital','clinic','diagnostic'],
    fun:       ['netflix','spotify','prime','hotstar','pvr','inox','bookmyshow'],
    other:     [],
  };
  let category: CategoryKey = 'other';
  const searchText = (merchant + ' ' + text).toLowerCase();
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => searchText.includes(kw))) {
      category = cat as CategoryKey; break;
    }
  }

  return { amount, merchant, category, bank, type, rawSMS: text };
}

export function parseMultipleSMS(text: string): SMSParseResult[] {
  const messages = text.split(/\n{2,}|---+|===+/).filter(s => s.trim().length > 10);
  return messages
    .map(parseSMS)
    .filter((r): r is SMSParseResult => r !== null && r.type === 'debit');
}
