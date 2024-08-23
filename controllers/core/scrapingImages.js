// controllers/core/scrapingImages.js

import axios from "axios";
import * as cheerio from "cheerio";

class ScrapingImages {
  async scrapeImageFromArticle(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Try to find the main image
      const mainImage =
        $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        $("article img").first().attr("src");

      if (mainImage) {
        return mainImage.startsWith("http")
          ? mainImage
          : `${new URL(url).origin}${mainImage}`;
      }

      return null;
    } catch (error) {
      console.error(`Error scraping image from ${url}:`, error.message);
      return null;
    }
  }
}

export default new ScrapingImages();
