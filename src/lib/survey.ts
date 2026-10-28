// Exact wording from official form OF/SAM/019 (TAF ENERGIES PLC). Do not edit wording.

export const DOC = {
  companyLabelAm: "የተቋም ስም",
  companyLabelEn: "Company Name",
  companyAm: "ታፍ ኢነርጂስ ኃላ/የተ/የግ/ማህበር",
  companyEn: "TAF ENERGIES PLC",
  docNoLabelAm: "የሰነድ ቁጥር",
  docNoLabelEn: "Document No.",
  docNo: "OF/SAM/019",
  titleLabelAm: "ርዕስ",
  titleLabelEn: "title",
  titleAm: "የደንበኛ እርካታ የዳሰሳ ጥናት መጠይቅ ቅጽ",
  titleEn: "CUSTOMER SATISFACTION SURVEY QUESTIONARY FORM",
  issueLabelAm: "ዕትም ቁጥር",
  issueLabelEn: "Issue No.",
  issueNo: "01",
  pageLabelAm: "የገፅ ቁጥር",
  pageLabelEn: "Page No.",
  footerAm: "ሰነዱን ከመጠቀምዎ በፊት ትክክለኛ ዕትም መሆኑን ያረጋግጡ!!",
  footerEn: "PLEASE MAKE SURE THAT THIS IS THE CORRECT ISSUE BEFORE USE",
  watermark: "APPROVED AND CONTROLLED COPY",
};

export const S1 = {
  title: "ክፍል 1፡ የደንበኛ መረጃ",
  q1_1: "1.1 የደንበኛው ስም (አማራጭ)፡",
  q1_2: "1.2 የድርጅቱ ስም (ካለ)፡",
  q1_3: "1.3 የተገናኙበት መረጃ (አማራጭ)፡",
  q1_4: "1.4 አገልግሎቱን ያገኙበት ቀን፡",
  q1_5: "1.5 የተጠቀሙበት የአገልግሎት አይነት፡",
  services: ["ነዳጅ ማድረስ", "የቅባት አቅርቦት", "የቴክኒክ ድጋፍ"],
  other: "ሌላ፡",
};

export const S2 = {
  title: "ክፍል 2፡ የአገልግሎት ጥራት ደረጃ አሰጣጥ",
  intro:
    "ከዚህ በታች የቀረቡትን የአገልግሎታችንን ገጽታዎች ከ 1 እስከ 5 ባለው ሚዛን ይገምግሙ፡ (1 = ደካማ፣ 2 = መካከለኛ፣ 3 = ጥሩ፣ 4 = በጣም ጥሩ፣ 5 = እጅግ በጣም ጥሩ)",
  scale: { 1: "ደካማ", 2: "መካከለኛ", 3: "ጥሩ", 4: "በጣም ጥሩ", 5: "እጅግ በጣም ጥሩ" } as Record<number, string>,
  questions: [
    ["2.1", "ትዕዛዝ ለማዘዝ ምን ያህል ቀላል ነበር?"],
    ["2.2", "ትዕዛዞች በትክክል ተዘጋጅተዋል?"],
    ["2.3", "ትዕዛዝ ለማዘዝ መንገዱ ይታወቅ ነበር?"],
    ["2.4", "አገልግሎቱ በሰዓቱ ደርሷል?"],
    ["2.5", "ትዕዛዙ በትክክል ተሟልቷል (የተጠየቁት ምርቶች/አገልግሎቶች በትክክል ደርሰዋል)?"],
    ["2.6", "የተቀበሉት ምርቶች ጥራት ምን ይመስል ነበር?"],
    ["2.7", "የተላኩት መጠኖች በደረሰኙ ላይ ከተጠቀሱት ጋር አንድ ናቸው?"],
    ["2.8", "የሰራተኞች ሙያዊነት እና ጨዋነት ምን ይመስል ነበር?"],
    ["2.9", "ለጥያቄዎች እና ስጋቶች ምን ያህል ፈጣን ምላሽ ሰጥተናል?"],
    ["2.10", "በአጠቃላይ በአገልግሎታችን ምን ያህል ረክተዋል?"],
    ["2.11", "ከሌሎች አቅራቢዎች ጋር ሲነጻጸር የምርቶቹ ዋጋ ምን ይመስላል?"],
    ["2.12", "ለግዢ ጥያቄዎ የሚሆን በቂ ክምችት ነበረን?"],
    ["2.13", "ከድርጅታችን የተሰጠው የቴክኒክ መመሪያ ምን ያህል አጋዥ ነበር?"],
  ] as [string, string][],
};

export const S3 = {
  title: "ክፍል 3፡ ክፍት የሆኑ ጥያቄዎች",
  questions: [
    ["3.1", "ስለ አገልግሎታችን በጣም የወደዱት ነገር ምንድን ነው?"],
    ["3.2", "ከድርጅታችን ጋር ያሎትን አጠቃላይ ተሞክሮ እንዴት ይገልጹታል?"],
    ["3.3", "የእኛ ምርት/አገልግሎት የሚጠብቁትን አሟልቷል?"],
    ["3.4", "ምን ማሻሻያዎች እንደሚያስፈልጉ ያስባሉ?"],
    ["3.5", "ከአገልግሎቶቻችን ጋር በተያያዘ ያጋጠመዎት ችግር አለ? አዎ ከሆነ፣ እባክዎን ይግለጹ።"],
    ["3.6", "አገልግሎቶቻችንን ለሌሎች ይመክራሉ? ለምን?"],
  ] as [string, string][],
};

export const S4 = {
  title: "ክፍል 4፡ የወደፊት የሚጠበቁ ነገሮች",
  questions: [
    ["4.1", "ምን ተጨማሪ አገልግሎቶች ወይም ምርቶች እንድናቀርብልዎ ይፈልጋሉ?"],
    ["4.2", "2. ለወደፊቱ የሚጠብቁትን በተሻለ እንዴት ማሟላት እንችላለን?"],
    ["4.3", "የአገልግሎት ጥራትን ለመጨመር ምን ይመክራሉ?"],
  ] as [string, string][],
};

export const S5 = {
  title: "ክፍል 5፡ ክትትል (አማራጭ)",
  q5_1: "5.1 ስለ ግብረመልስዎ ክትትል እንዲደረግልዎ ይፈልጋሉ?",
  yes: "አዎ",
  no: "አይ",
  q5_2: "5.2 የሚመርጡት የግንኙነት ዘዴ፡",
  methods: ["ኢሜይል", "ስልክ"],
  other: "ሌላ፡",
};

export const RATING_IDS = S2.questions.map(([id]) => id);

export type SurveyData = {
  customer_name: string;
  company_name: string;
  contact_info: string;
  service_date: string;
  service_types: string[];
  service_other: string;
  ratings: Record<string, number>;
  open_answers: Record<string, string>;
  follow_up: boolean | null;
  contact_methods: string[];
  contact_other: string;
};

export const emptySurvey = (): SurveyData => ({
  customer_name: "",
  company_name: "",
  contact_info: "",
  service_date: "",
  service_types: [],
  service_other: "",
  ratings: {},
  open_answers: {},
  follow_up: null,
  contact_methods: [],
  contact_other: "",
});

export const DRAFT_KEY = "taf-of-sam-019-draft";
