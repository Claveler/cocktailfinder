#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Available fonts with their configurations
const FONTS = {
  geist: { variable: '--font-geist-sans', name: 'Geist' },
  inter: { variable: '--font-inter', name: 'Inter' },
  raleway: { variable: '--font-raleway', name: 'Raleway' },
  poppins: { variable: '--font-poppins', name: 'Poppins' },
  openSans: { variable: '--font-open-sans', name: 'Open Sans' },
  roboto: { variable: '--font-roboto', name: 'Roboto' },
  lato: { variable: '--font-lato', name: 'Lato' },
  hankenGrotesk: { variable: '--font-hanken-grotesk', name: 'Hanken Grotesk' }
};

function switchFont(fontKey) {
  if (!FONTS[fontKey]) {
    console.error(`❌ Invalid font key: ${fontKey}`);
    console.log('Available fonts:', Object.keys(FONTS).join(', '));
    return;
  }

  const font = FONTS[fontKey];
  
  try {
    // Update lib/fonts.ts
    const fontsPath = path.join(__dirname, '..', 'lib', 'fonts.ts');
    let fontsContent = fs.readFileSync(fontsPath, 'utf8');
    fontsContent = fontsContent.replace(
      /const CURRENT_FONT = ".*" as const;/,
      `const CURRENT_FONT = "${fontKey}" as const;`
    );
    fs.writeFileSync(fontsPath, fontsContent);

    // Update tailwind.config.ts
    const tailwindPath = path.join(__dirname, '..', 'tailwind.config.ts');
    let tailwindContent = fs.readFileSync(tailwindPath, 'utf8');
    tailwindContent = tailwindContent.replace(
      /sans: \[\s*"var\(--font-[^)]+\)",/,
      `sans: [\n          "var(${font.variable})",`
    );
    fs.writeFileSync(tailwindPath, tailwindContent);

    console.log(`✅ Successfully switched to ${font.name} (${fontKey})`);
    console.log('🔄 Restart your development server to see changes');
    
  } catch (error) {
    console.error('❌ Error switching font:', error.message);
  }
}

// Get font key from command line argument
const fontKey = process.argv[2];

if (!fontKey) {
  console.log('🎨 Font Switcher');
  console.log('Usage: node scripts/switch-font.js <fontKey>');
  console.log('');
  console.log('Available fonts:');
  Object.entries(FONTS).forEach(([key, font]) => {
    console.log(`  ${key} - ${font.name}`);
  });
} else {
  switchFont(fontKey);
}
