# Logo Assets

This folder contains the logo assets for Piscola.

## Current Logo

- **File**: `piscola-logo.svg`
- **Dimensions**: Scalable SVG
- **Usage**: Navigation bar logo (replaces both icon and text)
- **Size**: Desktop: 120x32px, Mobile: 100x28px

## Replacing the Logo

To replace the current placeholder logo with your own:

1. **Prepare your logo**:
   - Save as SVG format for best quality and scalability
   - Recommended: 32x32 or 24x24 pixel equivalent size
   - Use `currentColor` for fills to respect theme colors
   - Keep file size small for web performance

2. **Replace the file**:
   - Replace `public/assets/piscola-logo.svg` with your new logo
   - Keep the same filename (`piscola-logo.svg`) or update the import path in `components/common/NavBar.tsx`

3. **Adjust sizing if needed**:
   - Logo dimensions: Desktop (120x32px), Mobile (100x28px)
   - To change size, update the `width`, `height`, and `className` props in `NavBar.tsx`:
     ```tsx
     <Image
       src="/assets/piscola-logo.svg"
       alt="Piscola Logo"
       width={120}  // Change this (desktop)
       height={32}  // Change this (desktop)
       className="h-8 w-auto"  // Change this
     />
     ```

## File Formats Supported

- **SVG** (recommended): Scalable, small file size, theme-aware
- **PNG**: Good for complex logos, fixed resolution
- **JPEG**: For photographic logos (less common for brand logos)

## Notes

- The logo appears in both desktop and mobile navigation
- Logo replaces both icon and text in the navigation bar
- Different sizes are used for desktop (120x32px) and mobile (100x28px) layouts
- SVG format recommended for best scalability and performance
- For non-SVG formats, you may need to create dark/light versions if needed
