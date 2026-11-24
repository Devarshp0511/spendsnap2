import * as ImagePicker from 'expo-image-picker';
import { CategoryKey } from '../constants/theme';

const OCR_SPACE_URL = 'https://api.ocr.space/parse/image';

export interface OCRResult {
  merchant: string;
  amount: number;
  date: string;
  category: CategoryKey;
  rawText: string;
  confidence: 'high' | 'medium' | 'low';
}

function parseReceiptText(text: string): Omit<OCRResult, 'rawText'> {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = text.toLowerCase();

  // ── Extract amount ────────────────────────────────────────────────────────
  let amount = 0;
  const amountPatterns = [
    /total[:\s]+(?:rs\.?|₹|inr)?\s*(\d+(?:[.,]\d{1,2})?)/i,
    /grand\s*total[:\s]+(?:rs\.?|₹|inr)?\s*(\d+(?:[.,]\d{1,2})?)/i,
    /net\s*amount[:\s]+(?:rs\.?|₹|inr)?\s*(\d+(?:[.,]\d{1,2})?)/i,
    /amount[:\s]+(?:rs\.?|₹|inr)?\s*(\d+(?:[.,]\d{1,2})?)/i,
    /(?:rs\.?|₹|inr)\s*(\d+(?:[.,]\d{1,2})?)/i,
    /(\d+(?:[.,]\d{2}))\s*(?:rs\.?|₹|inr)/i,
    /(\d{2,6}(?:\.\d{2})?)/,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(',', '.'));
      if (num > 0 && num < 1000000) { amount = num; break; }
    }
  }

  // ── Extract merchant ──────────────────────────────────────────────────────
  let merchant = '';
  const skipWords = ['receipt','invoice','bill','tax','gst','date','time','order','table','phone','address','thank'];
  for (const line of lines.slice(0, 6)) {
    const lower = line.toLowerCase();
    const isSkip = skipWords.some(w => lower.includes(w));
    const hasLetters = /[a-zA-Z]/.test(line);
    const notTooLong = line.length < 50;
    const notTooShort = line.length > 2;
    if (!isSkip && hasLetters && notTooLong && notTooShort) {
      merchant = line;
      break;
    }
  }
  if (!merchant) merchant = 'Unknown merchant';

  // ── Guess category ────────────────────────────────────────────────────────
  const categoryKeywords: Record<CategoryKey, string[]> = {
    food:      ['restaurant','cafe','coffee','pizza','burger','swiggy','zomato','food','kitchen','dhaba','hotel','bakery','juice','chai','tea','biryani','mess','grill','diner','eatery','canteen'],
    transport: ['uber','ola','rapido','auto','taxi','cab','petrol','fuel','diesel','parking','toll','metro','bus','train','flight','irctc','rapido','porter'],
    shopping:  ['mart','store','shop','mall','amazon','flipkart','myntra','retail','market','bazaar','dmart','bigbasket','reliance','lifestyle','fashion','apparel'],
    bills:     ['electric','electricity','water','gas','internet','wifi','broadband','rent','maintenance','recharge','mobile','airtel','jio','vi','bsnl','postpaid'],
    health:    ['pharmacy','medical','hospital','clinic','doctor','medicine','apollo','medplus','lab','diagnostic','health','wellness','chemist','optical'],
    fun:       ['cinema','movie','pvr','inox','netflix','spotify','game','entertainment','club','bar','pub','lounge','bowling','amusement'],
    other:     [],
  };

  let category: CategoryKey = 'other';
  const searchText = (merchant + ' ' + fullText).toLowerCase();
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => searchText.includes(kw))) {
      category = cat as CategoryKey;
      break;
    }
  }

  const confidence = amount > 0 && merchant !== 'Unknown merchant' ? 'high'
    : amount > 0 || merchant !== 'Unknown merchant' ? 'medium'
    : 'low';

  return { merchant, amount, date: new Date().toISOString(), category, confidence };
}

async function processWithOCRSpace(uri: string, apiKey: string): Promise<OCRResult> {
  // Build form data
  const formData = new FormData();
  formData.append('apikey', apiKey);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('isTable', 'true');
  formData.append('OCREngine', '2'); // Engine 2 is better for receipts

  // Append image
  const filename = uri.split('/').pop() ?? 'receipt.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  formData.append('file', { uri, name: filename, type } as any);

  const response = await fetch(OCR_SPACE_URL, {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = await response.json();

  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage?.[0] ?? 'OCR processing failed');
  }

  const rawText = data.ParsedResults?.[0]?.ParsedText ?? '';
  if (!rawText.trim()) throw new Error('No text found in image. Try better lighting.');

  const parsed = parseReceiptText(rawText);
  return { ...parsed, rawText };
}

export async function scanBillFromCamera(apiKey: string): Promise<OCRResult | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') throw new Error('Camera permission denied');

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
    allowsEditing: true,
  });

  if (result.canceled || !result.assets[0]) return null;
  return await processWithOCRSpace(result.assets[0].uri, apiKey);
}

export async function scanBillFromGallery(apiKey: string): Promise<OCRResult | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
    allowsEditing: true,
  });

  if (result.canceled || !result.assets[0]) return null;
  return await processWithOCRSpace(result.assets[0].uri, apiKey);
}
