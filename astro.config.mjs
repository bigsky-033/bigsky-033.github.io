import { defineConfig } from "astro/config";

import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
  site: "https://bigsky-033.github.io",
  integrations: [preact()],
});
