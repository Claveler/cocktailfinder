# 🎨 Font Switching Guide

Easy font testing system for CocktailFinder - switch between different Google Fonts with one line change!

## 🚀 How to Switch Fonts

1. **Open** `lib/fonts.ts`
2. **Find** the `CURRENT_FONT` variable (around line 58)
3. **Change** it to any of these options:

```typescript
const CURRENT_FONT: "geist" | "inter" | "raleway" | "poppins" | "openSans" | "roboto" | "lato" = "geist";
//                                                                                                    ↑ 
//                                                                                        Change this value!
```

## 📝 Available Fonts

| Font Name | Value | Description |
|-----------|-------|-------------|
| **Geist** | `"geist"` | ✅ **Default** - Clean, modern, optimized for UI |
| **Inter** | `"inter"` | Popular, excellent readability |
| **Raleway** | `"raleway"` | Elegant, sophisticated |
| **Poppins** | `"poppins"` | Friendly, rounded |
| **Open Sans** | `"openSans"` | Neutral, professional |
| **Roboto** | `"roboto"` | Google's Material Design font |
| **Lato** | `"lato"` | Humanist, approachable |

## 🔄 Example Font Switch

```typescript
// Current (Geist)
const CURRENT_FONT = "geist";

// Switch to Poppins
const CURRENT_FONT = "poppins";

// Switch to Inter  
const CURRENT_FONT = "inter";
```

## ➕ Adding New Google Fonts

1. **Import** the font in `lib/fonts.ts`:
```typescript
import { Your_Font_Name } from "next/font/google";
```

2. **Configure** the font:
```typescript
const yourFont = Your_Font_Name({
  subsets: ["latin"],
  variable: "--font-your-font",
  display: "swap",
});
```

3. **Add** to font configs:
```typescript
yourFont: {
  primary: yourFont,
  mono: geistMono,
  cssVariable: "--font-your-font",
  tailwindClass: "font-sans",
},
```

4. **Update** the type and CURRENT_FONT:
```typescript
const CURRENT_FONT: "geist" | "inter" | "raleway" | "poppins" | "openSans" | "roboto" | "lato" | "yourFont" = "yourFont";
```

## 🎯 Performance Notes

- All fonts use `display: "swap"` for optimal loading
- Next.js automatically optimizes font loading
- Geist mono is kept for code/monospace text regardless of primary font choice
- Only the selected font is loaded (others are tree-shaken out)

## 💡 Tips

- **Test in production**: Font rendering can differ between dev and production
- **Consider weight availability**: Not all fonts have all weights (100-900)
- **Check readability**: Test with actual content, especially small text
- **Mobile testing**: Fonts can render differently on mobile devices

---

**Happy font testing!** 🎨 Just change one variable and see your entire app transform!
