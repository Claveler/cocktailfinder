import localFont from "next/font/local";
import {
  Inter,
  Raleway,
  Poppins,
  Open_Sans,
  Roboto,
  Lato,
  Bebas_Neue,
  Hanken_Grotesk
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

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
  display: "swap",
});

// Bebas Neue for headings
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  weight: ["400"],
  display: "swap",
});

// Font configuration - Change this to switch fonts easily!
type FontConfig = {
  primary: typeof geistSans;
  mono: typeof geistMono;
  heading: typeof bebasNeue;
  cssVariable: string;
  tailwindClass: string;
};

// 🎨 CHANGE THIS TO TEST DIFFERENT FONTS
const CURRENT_FONT = "inter" as const;

type FontKeys = "geist" | "inter" | "raleway" | "poppins" | "openSans" | "roboto" | "lato" | "hankenGrotesk";

const fontConfigs: Record<FontKeys, FontConfig> = {
  geist: {
    primary: geistSans,
    mono: geistMono,
    heading: bebasNeue,
    cssVariable: "--font-geist-sans",
    tailwindClass: "font-sans",
  },
  inter: {
    primary: inter,
    mono: geistMono, // Keep Geist mono for code
    heading: bebasNeue,
    cssVariable: "--font-inter",
    tailwindClass: "font-sans",
  },
  raleway: {
    primary: raleway,
    mono: geistMono,
    heading: bebasNeue,
    cssVariable: "--font-raleway",
    tailwindClass: "font-sans",
  },
  poppins: {
    primary: poppins,
    mono: geistMono,
    heading: bebasNeue,
    cssVariable: "--font-poppins",
    tailwindClass: "font-sans",
  },
  openSans: {
    primary: openSans,
    mono: geistMono,
    heading: bebasNeue,
    cssVariable: "--font-open-sans",
    tailwindClass: "font-sans",
  },
  roboto: {
    primary: roboto,
    mono: geistMono,
    heading: bebasNeue,
    cssVariable: "--font-roboto",
    tailwindClass: "font-sans",
  },
  lato: {
    primary: lato,
    mono: geistMono,
    heading: bebasNeue,
    cssVariable: "--font-lato",
    tailwindClass: "font-sans",
  },
  hankenGrotesk: {
    primary: hankenGrotesk,
    mono: geistMono,
    heading: bebasNeue,
    cssVariable: "--font-hanken-grotesk",
    tailwindClass: "font-sans",
  },
};

export const currentFontConfig = fontConfigs[CURRENT_FONT as FontKeys];
export const { primary: primaryFont, mono: monoFont, heading: headingFont } = currentFontConfig;
