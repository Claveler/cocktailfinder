# 🎨 Font System Guide

**Piscola.net** uses a modern dual-font system:
- **Primary font** (body text): [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk)
- **Heading font**: [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue) (with 150% scaling)

## 🚀 How to Change Primary Font

### 🎯 **Easy Method (Recommended)**

Use the automated font switcher script:

```bash
# Switch to any available font
npm run switch-font poppins
npm run switch-font inter  
npm run switch-font raleway
# ... etc
```

The script automatically updates all necessary files and tells you to restart the dev server.

### 📝 **Manual Method (Advanced)**

If you prefer manual control, update **TWO files**:

**Step 1** - Update `lib/fonts.ts`:
```typescript
const CURRENT_FONT = "hankenGrotesk" as const;
//                    ↑ Change this value!
```

**Step 2** - Update `tailwind.config.ts`:
```typescript
sans: [
  "var(--font-hanken-grotesk)", // ← Change this CSS variable
  "ui-sans-serif",
  // ...
```

**⚠️ Important:** Both files must match for the font system to work properly!

## 📝 Available Primary Fonts

| Font Name | TypeScript Value | CSS Variable | Description |
|-----------|------------------|--------------|-------------|
| **Hanken Grotesk** | `"hankenGrotesk"` | `--font-hanken-grotesk` | ✅ **Current** - Modern, clean, excellent readability |
| **Geist** | `"geist"` | `--font-geist-sans` | Clean, modern, optimized for UI |
| **Inter** | `"inter"` | `--font-inter` | Popular, excellent web readability |
| **Raleway** | `"raleway"` | `--font-raleway` | Elegant, sophisticated |
| **Poppins** | `"poppins"` | `--font-poppins` | Friendly, rounded |
| **Open Sans** | `"openSans"` | `--font-open-sans` | Neutral, professional |
| **Roboto** | `"roboto"` | `--font-roboto` | Google's Material Design font |
| **Lato** | `"lato"` | `--font-lato` | Humanist, approachable |

### Example: Switching to Inter

**Step 1** - In `lib/fonts.ts`:
```typescript
const CURRENT_FONT = "inter" as const;
```

**Step 2** - In `app/globals.css`:
```css
--font-primary: var(--font-inter); /* Currently: inter */
```

## 🔄 Example Font Switch

```typescript
// Current primary font (Hanken Grotesk)
const CURRENT_FONT = "hankenGrotesk" as const;

// Switch to Inter
const CURRENT_FONT = "inter" as const;

// Switch to Poppins  
const CURRENT_FONT = "poppins" as const;
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

3. **Add** to FontKeys type:
```typescript
type FontKeys = "geist" | "inter" | "raleway" | "poppins" | "openSans" | "roboto" | "lato" | "hankenGrotesk" | "yourFont";
```

4. **Add** to font configs:
```typescript
yourFont: {
  primary: yourFont,
  mono: geistMono, // Keep Geist mono for code
  heading: bebasNeue, // Keep Bebas Neue for headings
  cssVariable: "--font-your-font",
  tailwindClass: "font-sans",
},
```

5. **Update** Tailwind config (optional for primary use):
```typescript
// In tailwind.config.ts
sans: [
  "var(--font-your-font)",
  "ui-sans-serif",
  "system-ui", 
  "sans-serif",
],
```

## 🎯 Font System Architecture

### **Dual-Font Design:**
- **Primary Font**: Body text, buttons, UI elements
- **Heading Font**: All h1-h6 elements with 150% scaling via CSS
- **Monospace Font**: Code blocks, technical text (always Geist Mono)

### **How It Works:**
1. **Dynamic Loading**: Only the selected primary font loads (tree-shaken)
2. **CSS Variables**: Font changes propagate via CSS custom properties
3. **Static Mapping**: `globals.css` maps `--font-primary` to the selected font variable
4. **Tailwind Integration**: Configured via `font-sans`, `font-heading`, `font-mono`
5. **Type Safety**: TypeScript ensures only valid font keys are used

**Note:** This system requires manually updating both files when changing fonts, but provides maximum compatibility and performance.

## 🎯 Performance Notes

- All fonts use `display: "swap"` for optimal loading
- Next.js automatically optimizes font loading
- **Bebas Neue** is always loaded for headings (150% scaled via CSS)
- **Geist Mono** is always loaded for code/monospace text
- Only the **selected primary font** is loaded (others are tree-shaken out)

## 💡 Tips

- **Test in production**: Font rendering can differ between dev and production
- **Heading scaling**: Bebas Neue is scaled 150% via CSS custom properties
- **Weight availability**: Not all fonts have all weights (check Google Fonts)
- **Mobile testing**: Fonts render differently on mobile devices
- **Fallback fonts**: System fonts provide fallbacks for loading states

---

**Current Setup:** Hanken Grotesk (primary) + Bebas Neue (headings) for the perfect balance of readability and brand personality! 🎨
