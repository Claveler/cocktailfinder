import { Suspense } from "react";
import ThemeCustomizer from "./ThemeCustomizer";

export default function ThemePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Theme Customization</h1>
          <p className="text-muted-foreground">
            Customize the color scheme of your Piscola application. Changes will
            be applied instantly across the entire interface.
          </p>
        </div>

        <Suspense fallback={<div>Loading theme customizer...</div>}>
          <ThemeCustomizer />
        </Suspense>
      </div>
    </div>
  );
}
