import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function itunesAudioProxy() {
  return {
    name: "itunes-audio-proxy",

    configureServer(server) {
      server.middlewares.use(
        "/api/itunes-audio",
        async (req, res, next) => {
          try {
            const requestUrl = new URL(
              req.url || "",
              "http://localhost"
            );

            const audioUrl = requestUrl.searchParams.get("url");

            if (!audioUrl) {
              res.statusCode = 400;
              res.end("Audio URL missing");
              return;
            }

            const targetUrl = new URL(audioUrl);

            if (targetUrl.hostname !== "audio-ssl.itunes.apple.com") {
              res.statusCode = 403;
              res.end("Invalid audio source");
              return;
            }

            const response = await fetch(targetUrl);

            if (!response.ok) {
              res.statusCode = response.status;
              res.end("Audio could not be loaded");
              return;
            }

            const buffer = Buffer.from(
              await response.arrayBuffer()
            );

            res.statusCode = 200;
            res.setHeader("Content-Type", "audio/mp4");
            res.setHeader("Content-Length", buffer.length);
            res.setHeader("Cache-Control", "no-store");

            res.end(buffer);
          } catch (error) {
            console.error("iTunes audio proxy error:", error);

            if (!res.headersSent) {
              res.statusCode = 500;
              res.end("Audio proxy error");
            }
          }
        }
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), itunesAudioProxy()],

  server: {
    proxy: {
      "/api/itunes": {
        target: "https://itunes.apple.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/itunes/, "/search"),
      },
    },
  },
});