// Hebrew date conversion utilities

const hebrewDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const hebrewMonths = [
  'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול'
];

const hebrewNumbers = {
  1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט', 10: 'י',
  11: 'יא', 12: 'יב', 13: 'יג', 14: 'יד', 15: 'טו', 16: 'טז', 17: 'יז', 18: 'יח', 19: 'יט', 20: 'כ',
  21: 'כא', 22: 'כב', 23: 'כג', 24: 'כד', 25: 'כה', 26: 'כו', 27: 'כז', 28: 'כח', 29: 'כט', 30: 'ל'
};

function getHebrewNumber(num: number): string {
  return hebrewNumbers[num as keyof typeof hebrewNumbers] || num.toString();
}

function getHebrewYear(year: number): string {
  // Convert Gregorian year to approximate Hebrew year
  const hebrewYear = year + 3760;
  
  // Convert to Hebrew letters format (simplified)
  const thousands = Math.floor(hebrewYear / 1000);
  const remainder = hebrewYear % 1000;
  const hundreds = Math.floor(remainder / 100);
  const tens = Math.floor((remainder % 100) / 10);
  const ones = remainder % 10;
  
  let result = '';
  
  // Add thousands (ה for 5000s)
  if (thousands === 5) result += 'ה';
  
  // Add hundreds
  if (hundreds > 0) {
    const hundredsMap: { [key: number]: string } = {
      1: 'ק', 2: 'ר', 3: 'ש', 4: 'ת', 5: 'תק', 6: 'תר', 7: 'תש', 8: 'תת', 9: 'תתק'
    };
    result += hundredsMap[hundreds] || '';
  }
  
  // Add tens and ones
  if (tens === 1 && ones === 5) {
    result += 'טו'; // Special case for 15
  } else if (tens === 1 && ones === 6) {
    result += 'טז'; // Special case for 16
  } else {
    const tensMap: { [key: number]: string } = {
      1: 'י', 2: 'כ', 3: 'ל', 4: 'מ', 5: 'נ', 6: 'ס', 7: 'ע', 8: 'פ', 9: 'צ'
    };
    if (tens > 0) result += tensMap[tens] || '';
    
    const onesMap: { [key: number]: string } = {
      1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט'
    };
    if (ones > 0) result += onesMap[ones] || '';
  }
  
  return result + '"';
}

export function getHebrewDate(): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const date = now.getDate();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();
  
  // Get Hebrew day of week (Sunday = א)
  const hebrewDay = hebrewDays[dayOfWeek];
  
  // Get Hebrew date
  const hebrewDate = getHebrewNumber(date);
  
  // Get Hebrew month (approximate mapping)
  const hebrewMonth = hebrewMonths[month];
  
  // Get Hebrew year
  const hebrewYear = getHebrewYear(year);
  
  return `${hebrewDay} ${hebrewDate} ${hebrewMonth} ${hebrewYear}`;
}

// Format a Hebrew date from API response or date string using Hebcal API
export async function formatHebrewDate(dateInput: string | Date): Promise<string> {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Call the accurate Hebrew date API (Hebcal)
    const response = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.hebrew) {
        // Return the precise Hebrew date from Hebcal API
        return data.hebrew;
      }
    }
    
    // If API fails, fallback to local calculation
    return formatHebrewDateLocal(dateInput instanceof Date ? dateInput : new Date(dateInput));
  } catch (error) {
    console.error('Error formatting Hebrew date:', error);
    return formatHebrewDateLocal(dateInput instanceof Date ? dateInput : new Date(dateInput));
  }
}

// Local Hebrew date calculation as fallback
function formatHebrewDateLocal(date: Date): string {
  const dayOfWeek = date.getDay();
  const dateNum = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  const hebrewDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  
  // Approximate Hebrew month mapping (Tishrei starts around September)
  const hebrewMonths = [
    'תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט', 'אדר',
    'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול'
  ];
  
  const hebrewNumbers = {
    1: 'א׳', 2: 'ב׳', 3: 'ג׳', 4: 'ד׳', 5: 'ה׳', 6: 'ו׳', 7: 'ז׳', 8: 'ח׳', 9: 'ט׳', 10: 'י׳',
    11: 'יא׳', 12: 'יב׳', 13: 'יג׳', 14: 'יד׳', 15: 'טו׳', 16: 'טז׳', 17: 'יז׳', 18: 'יח׳', 19: 'יט׳', 20: 'כ׳',
    21: 'כא׳', 22: 'כב׳', 23: 'כג׳', 24: 'כד׳', 25: 'כה׳', 26: 'כו׳', 27: 'כז׳', 28: 'כח׳', 29: 'כט׳', 30: 'ל׳'
  };
  
  const hebrewDay = hebrewDays[dayOfWeek];
  const hebrewDate = hebrewNumbers[dateNum as keyof typeof hebrewNumbers] || dateNum.toString();
  
  // Adjust month for Hebrew calendar (rough approximation)
  let hebrewMonthIndex = (month + 6) % 12; // Rough conversion
  const hebrewMonth = hebrewMonths[hebrewMonthIndex];
  
  return `${hebrewDay} ${hebrewDate} ${hebrewMonth} תשפ״ה`;
}

// Cache for Hebrew dates to avoid repeated API calls
const hebrewDateCache = new Map<string, string>();

// Synchronous version that uses cache and API when needed
export function formatHebrewDateSync(dateInput: string | Date, jewishTimesData?: any): string {
  try {
    const inputDate = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const today = new Date();
    
    // Create cache key
    const cacheKey = `${inputDate.getFullYear()}-${inputDate.getMonth() + 1}-${inputDate.getDate()}`;
    
    // Check cache first
    if (hebrewDateCache.has(cacheKey)) {
      return hebrewDateCache.get(cacheKey)!;
    }
    
    // Check if the input date is today and we have accurate jewish times data
    if (jewishTimesData?.hebrewDate?.formatted && 
        inputDate.toDateString() === today.toDateString()) {
      const result = jewishTimesData.hebrewDate.formatted;
      hebrewDateCache.set(cacheKey, result);
      return result;
    }
    
    // For non-today dates, call API asynchronously and return immediate result
    fetchAndCacheHebrewDate(inputDate, cacheKey);
    
    // Return immediate calculation while API loads in background
    return formatHebrewDateLocal(inputDate);
  } catch (error) {
    console.error('Error formatting Hebrew date sync:', error);
    return formatHebrewDateLocal(typeof dateInput === 'string' ? new Date(dateInput) : dateInput);
  }
}

// Background function to fetch and cache Hebrew dates
async function fetchAndCacheHebrewDate(date: Date, cacheKey: string) {
  try {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const response = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.hebrew) {
        hebrewDateCache.set(cacheKey, data.hebrew);
        // Trigger re-render if component is still mounted
        window.dispatchEvent(new CustomEvent('hebrewDateUpdated', { detail: { cacheKey, date: data.hebrew } }));
      }
    }
  } catch (error) {
    console.error('Background Hebrew date fetch error:', error);
  }
}