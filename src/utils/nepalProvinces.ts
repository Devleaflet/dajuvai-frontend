export const provincesWithDistricts: Record<string, string[]> = {
  "Bagmati": [
    "sindhuli",
    "ramechhap",
    "dolakha",
    "bhaktapur",
    "dhading",
    "kathmandu",
    "kavrepalanchok",
    "lalitpur",
    "nuwakot",
    "rasuwa",
    "sindhupalchok",
    "chitwan",
    "makwanpur"
  ],
  "Gandaki": [
    "baglung",
    "gorkha",
    "kaski",
    "lamjung",
    "manang",
    "mustang",
    "myagdi",
    "nawalpur",
    "parbat",
    "syangja",
    "tanahun"
  ],
  "Karnali": [
    "western rukum",
    "salyan",
    "dolpa",
    "humla",
    "jumla",
    "kalikot",
    "mugu",
    "surkhet",
    "dailekh",
    "jajarkot"
  ],
  "Koshi": [
    "bhojpur",
    "dhankuta",
    "ilam",
    "jhapa",
    "khotang",
    "morang",
    "okhaldhunga",
    "panchthar",
    "sankhuwasabha",
    "solukhumbu",
    "sunsari",
    "taplejung",
    "terhathum",
    "udayapur"
  ],
  "Lumbini": [
    "kapilvastu",
    "rupandehi",
    "arghakhanchi",
    "gulmi",
    "palpa",
    "dang",
    "pyuthan",
    "rolpa",
    "eastern rukum",
    "banke",
    "bardiya"
  ],
  "Madhesh": [
    "sarlahi",
    "dhanusha",
    "bara",
    "rautahat",
    "saptari",
    "siraha",
    "mahottari",
    "parsa"
  ],
  "Sudurpashchim": [
    "achham",
    "baitadi",
    "bajhang",
    "bajura",
    "dadeldhura",
    "darchula",
    "doti",
    "kailali",
    "kanchanpur"
  ]
};

export const getProvinceForDistrict = (district: string): string => {
  if (!district) return "-";
  const normalized = district.trim().toLowerCase();
  
  for (const [province, districts] of Object.entries(provincesWithDistricts)) {
    if (districts.includes(normalized)) {
      return province;
    }
  }
  
  return "-";
};
