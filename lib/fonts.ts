import localFont from "next/font/local";
import {
  Inter,
  Raleway,
  Poppins,
  Open_Sans,
  Roboto,
  Lato,
} from "next/font/google";

// Local fonts (Geist)
const geistSans = localFont({
  src: "../app/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../app/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Google Fonts options
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["100", "300", "400", "500", "700", "900"],
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  weight: ["100", "300", "400", "700", "900"],
  display: "swap",
});

// Font configuration - Change this to switch fonts easily!
type FontConfig = {
  primary: typeof geistSans;
  mono: typeof geistMono;
  cssVariable: string;
  tailwindClass: string;
};

// 🎨 CHANGE THIS TO TEST DIFFERENT FONTS
const CURRENT_FONT:
  | "geist"
  | "inter"
  | "raleway"
  | "poppins"
  | "openSans"
  | "roboto"
  | "lato" = "geist";

const fontConfigs: Record<typeof CURRENT_FONT, FontConfig> = {
  geist: {
    primary: geistSans,
    mono: geistMono,
    cssVariable: "--font-geist-sans",
    tailwindClass: "font-sans",
  },
  inter: {
    primary: inter,
    mono: geistMono, // Keep Geist mono for code
    cssVariable: "--font-inter",
    tailwindClass: "font-sans",
  },
  raleway: {
    primary: raleway,
    mono: geistMono,
    cssVariable: "--font-raleway",
    tailwindClass: "font-sans",
  },
  poppins: {
    primary: poppins,
    mono: geistMono,
    cssVariable: "--font-poppins",
    tailwindClass: "font-sans",
  },
  openSans: {
    primary: openSans,
    mono: geistMono,
    cssVariable: "--font-open-sans",
    tailwindClass: "font-sans",
  },
  roboto: {
    primary: roboto,
    mono: geistMono,
    cssVariable: "--font-roboto",
    tailwindClass: "font-sans",
  },
  lato: {
    primary: lato,
    mono: geistMono,
    cssVariable: "--font-lato",
    tailwindClass: "font-sans",
  },
};

export const currentFontConfig = fontConfigs[CURRENT_FONT];
export const { primary: primaryFont, mono: monoFont } = currentFontConfig;
