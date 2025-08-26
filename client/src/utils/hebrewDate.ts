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
  
  return `${hebrewDay}' ${hebrewDate} ${hebrewMonth} ${hebrewYear}`;
}

// Format a Hebrew date from API response or date string
export async function formatHebrewDate(dateInput: string | Date): Promise<string> {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Call the Hebrew date API
    const response = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`);
    const data = await response.json();
    
    if (data && data.hebrew) {
      return data.hebrew;
    } else {
      // Fallback to simple Hebrew date
      return getHebrewDate();
    }
  } catch (error) {
    console.error('Error formatting Hebrew date:', error);
    return getHebrewDate();
  }
}

// Synchronous version using the existing jewish-times API data
export function formatHebrewDateSync(dateInput: string | Date, jewishTimesData?: any): string {
  try {
    const inputDate = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const today = new Date();
    
    // Check if the input date is today and we have jewish times data
    if (jewishTimesData?.hebrewDate?.formatted && 
        inputDate.toDateString() === today.toDateString()) {
      return jewishTimesData.hebrewDate.formatted;
    }
    
    // For other dates, generate Hebrew date using our function
    const dayOfWeek = inputDate.getDay();
    const date = inputDate.getDate();
    const month = inputDate.getMonth();
    
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
    
    const hebrewDay = hebrewDays[dayOfWeek];
    const hebrewDate = getHebrewNumber(date);
    const hebrewMonth = hebrewMonths[month];
    
    return `${hebrewDay}' ${hebrewDate} ${hebrewMonth} תשפ״ה`;
  } catch (error) {
    console.error('Error formatting Hebrew date sync:', error);
    return getHebrewDate();
  }
}