export type Technique = "oil" | "watercolor" | "acrylic" | "charcoal" | "pastel" | "mixed";
export type Level = "beginner" | "intermediate" | "advanced";

export const techniqueLabels: Record<Technique, string> = {
  oil: "שמן",
  watercolor: "אקוורל",
  acrylic: "אקריליק",
  charcoal: "פחם",
  pastel: "פסטל",
  mixed: "טכניקה מעורבת",
};

export const levelLabels: Record<Level, string> = {
  beginner: "מתחילים",
  intermediate: "בינוני",
  advanced: "מתקדם",
};

export const levelColors: Record<Level, string> = {
  beginner: "bg-level-beginner",
  intermediate: "bg-level-intermediate",
  advanced: "bg-level-advanced",
};

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  technique: Technique;
  dimensions: string;
  description: string;
  featured?: boolean;
}

export interface Workshop {
  id: string;
  name: string;
  description: string;
  instructor: string;
  technique: Technique;
  date: string;
  time: string;
  duration: number;
  level: Level;
  price: number;
  spotsTotal: number;
  spotsTaken: number;
}

export const artworks: Artwork[] = [
  { id: "a1", title: "שקיעה בנמל", artist: "דנה לוין", technique: "oil", dimensions: "60x80 ס\"מ", description: "ציור שמן של שקיעה מעל נמל יפו, בגוונים חמים של כתום וזהב", featured: true },
  { id: "a2", title: "דיוקן בפחם", artist: "רון כהן", technique: "charcoal", dimensions: "40x50 ס\"מ", description: "דיוקן אישה מפחם על נייר, עם דגש על משחקי אור וצל" },
  { id: "a3", title: "פרחי שדה", artist: "מיכל אברהם", technique: "watercolor", dimensions: "30x40 ס\"מ", description: "אקוורל עדין של פרחי בר בגוונים פסטליים", featured: true },
  { id: "a4", title: "העיר הלבנה", artist: "יואב שמש", technique: "acrylic", dimensions: "80x100 ס\"מ", description: "תל אביב מלמעלה באקריליק, גגות לבנים ושמיים כחולים" },
  { id: "a5", title: "טבע דומם", artist: "דנה לוין", technique: "oil", dimensions: "50x60 ס\"מ", description: "פירות ופרחים על שולחן עץ, ציור שמן קלאסי" },
  { id: "a6", title: "נוף הרים", artist: "מיכל אברהם", technique: "pastel", dimensions: "40x60 ס\"מ", description: "הרי אילת בפסטל רך, שכבות של סגול וכתום", featured: true },
  { id: "a7", title: "גלים", artist: "רון כהן", technique: "mixed", dimensions: "70x90 ס\"מ", description: "טכניקה מעורבת של אקריליק ודיו על ים סוער" },
  { id: "a8", title: "חתול ישן", artist: "יואב שמש", technique: "charcoal", dimensions: "30x40 ס\"מ", description: "רישום פחם מפורט של חתול מתכרבל" },
  { id: "a9", title: "גשם בעיר", artist: "דנה לוין", technique: "watercolor", dimensions: "35x50 ס\"מ", description: "רחוב גשום באקוורל, השתקפויות על המדרכה הרטובה" },
  { id: "a10", title: "אבסטרקט כחול", artist: "רון כהן", technique: "acrylic", dimensions: "100x100 ס\"מ", description: "ציור אבסטרקטי בגווני כחול עמוק וזהב", featured: true },
  { id: "a11", title: "ילדה עם כובע", artist: "מיכל אברהם", technique: "pastel", dimensions: "40x50 ס\"מ", description: "דיוקן ילדה בפסטל שמן, גוונים רכים וחמים" },
  { id: "a12", title: "שוק הכרמל", artist: "יואב שמש", technique: "mixed", dimensions: "60x80 ס\"מ", description: "סצנת שוק תוססת בטכניקה מעורבת, צבעים עזים" },
];

export const workshops: Workshop[] = [
  { id: "w1", name: "מבוא לציור שמן", description: "למדו את היסודות של ציור בשמן — ערבוב צבעים, שכבות, ומשיכות מכחול בסיסיות", instructor: "דנה לוין", technique: "oil", date: "2026-03-05", time: "10:00", duration: 180, level: "beginner", price: 280, spotsTotal: 12, spotsTaken: 8 },
  { id: "w2", name: "אקוורל נוף", description: "צירו נוף ישראלי באקוורל. נלמד שליטה במים, שקיפות וטכניקות רטוב-על-רטוב", instructor: "מיכל אברהם", technique: "watercolor", date: "2026-03-08", time: "14:00", duration: 150, level: "intermediate", price: 250, spotsTotal: 10, spotsTaken: 6 },
  { id: "w3", name: "רישום דיוקן בפחם", description: "סדנה אינטנסיבית לרישום פנים בפחם. פרופורציות, אור וצל, ביטוי", instructor: "רון כהן", technique: "charcoal", date: "2026-03-12", time: "18:00", duration: 180, level: "intermediate", price: 260, spotsTotal: 10, spotsTaken: 9 },
  { id: "w4", name: "אקריליק אבסטרקטי", description: "שחררו את היצירתיות! סדנה חופשית ליצירת ציור אבסטרקטי באקריליק", instructor: "רון כהן", technique: "acrylic", date: "2026-03-15", time: "10:00", duration: 150, level: "beginner", price: 240, spotsTotal: 14, spotsTaken: 5 },
  { id: "w5", name: "פסטל מתקדמים", description: "טכניקות מתקדמות בפסטל שמן — שכבות, מרקמים ומעברי צבע עשירים", instructor: "מיכל אברהם", technique: "pastel", date: "2026-03-19", time: "16:00", duration: 180, level: "advanced", price: 300, spotsTotal: 8, spotsTaken: 4 },
  { id: "w6", name: "ציור שמן — טבע דומם", description: "סדנה מעמיקה ליצירת טבע דומם קלאסי בשמן. קומפוזיציה, אור ומרקם", instructor: "דנה לוין", technique: "oil", date: "2026-03-22", time: "10:00", duration: 240, level: "advanced", price: 350, spotsTotal: 10, spotsTaken: 7 },
  { id: "w7", name: "טכניקה מעורבת — קולאז׳", description: "שלבו חומרים שונים — נייר, בד, צבע ודיו ליצירת קולאז׳ מקורי", instructor: "יואב שמש", technique: "mixed", date: "2026-03-26", time: "14:00", duration: 150, level: "beginner", price: 230, spotsTotal: 12, spotsTaken: 3 },
  { id: "w8", name: "אקוורל ערב — פרחים", description: "ערב יצירתי ומרגיע. צירו זר פרחים באקוורל תוך כדי מוזיקה רקע", instructor: "מיכל אברהם", technique: "watercolor", date: "2026-03-29", time: "19:00", duration: 120, level: "beginner", price: 220, spotsTotal: 14, spotsTaken: 11 },
];

export const studioInfo = {
  name: "סטודיו צבע",
  tagline: "צבעו את העולם שלכם",
  address: "רחוב שינקין 25, תל אביב",
  phone: "03-7771234",
  email: "hello@studio-tzeva.co.il",
  hours: [
    { days: "ראשון - חמישי", time: "09:00 - 21:00" },
    { days: "שישי", time: "09:00 - 14:00" },
    { days: "שבת", time: "סגור" },
  ],
  story: "סטודיו צבע נולד ב-2017 מתוך אהבה עמוקה לאמנות ולהוראה. המקום שלנו הוא מרחב יצירה חם ופתוח, שבו כל אחד — מהצעד הראשון ועד לאמנים מנוסים — מוזמן לגלות את הקול האמנותי שלו. הסטודיו מואר באור טבעי, מצויד בחומרים איכותיים, ומנוהל על ידי אמנים מנוסים שמאמינים שיצירה היא לכולם.",
  artist: {
    name: "דנה לוין",
    title: "מייסדת ואמנית ראשית",
    bio: "דנה היא אמנית ומדריכה עם 20 שנות ניסיון. בוגרת בצלאל, התמחתה בציור שמן ואקוורל. לימדה במוסדות מובילים ומציגה בגלריות בארץ ובחו\"ל. מאמינה שכל אדם נושא בתוכו אמן.",
  },
  values: [
    { title: "קבוצות קטנות", description: "עד 14 משתתפים בסדנה, כדי שכל אחד יקבל יחס אישי" },
    { title: "מדריכים מנוסים", description: "כל המדריכים שלנו אמנים פעילים עם ניסיון הוראה עשיר" },
    { title: "חומרים איכותיים", description: "צבעים, מכחולים ובדים מהמותגים המובילים — הכל כלול במחיר" },
  ],
};
