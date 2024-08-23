// utils/newsFormatter.js
import { format } from "date-fns";
import TurndownService from "turndown";

const turndownService = new TurndownService();

class NewsFormatter {
  constructor() {
    this.emojiMap = {
      palestine: "🇵🇸",
      conflicts: "⚔️",
      world: "🌍",
      general: "📰",
      breaking: "🚨",
    };
  }

  formatBreakingNews(news) {
    const emoji = this.emojiMap.breaking;
    let message = `${emoji} *BREAKING NEWS* ${emoji}\n\n`;
    message += `*${this.escapeMarkdown(news.title)}*\n\n`;
    message += `${this.escapeMarkdown(news.summary)}\n\n`;
    message += `🔗 [Read more](${news.link})\n`;
    message += `🕒 ${format(new Date(news.date), "MMM d, yyyy HH:mm")} UTC\n`;
    message += `📺 Source: ${this.escapeMarkdown(news.source)}`;
    return message;
  }

  formatNewsUpdate(categories) {
    let message = "📣 *Latest News Update* 📣\n\n";

    for (const [category, news] of Object.entries(categories)) {
      if (news.length > 0) {
        const emoji = this.emojiMap[category] || "📌";
        message += `${emoji} *${this.capitalizeFirstLetter(category)} News:*\n\n`;
        news.slice(0, 3).forEach((item, index) => {
          message += `${index + 1}. *${this.escapeMarkdown(item.title)}.*\n`;
          message += `${this.truncate(this.escapeMarkdown(item.summary), 150)}\n`;
          message += `🔗 [Read more](${item.link}) | 🕒 ${format(new Date(item.date), "MMM d, HH:mm")} UTC\n\n`;
        });
      }
    }

    message += "\nStay informed with @Notifycast";
    return message;
  }

  // formatDailyDigest(categories) {
  //   let message = "🗞 *Daily News Digest* 🗞\n\n";

  //   for (const [category, news] of Object.entries(categories)) {
  //     if (news.length > 0) {
  //       const emoji = this.emojiMap[category] || "📌";
  //       message += `${emoji} *${this.capitalizeFirstLetter(category)} Highlights:*\n\n`;
  //       news.slice(0, 5).forEach((item, index) => {
  //         message += `${index + 1}. *${this.escapeMarkdown(item.title)}*\n`;
  //         message += `${this.truncate(this.escapeMarkdown(item.summary), 200)}\n`;
  //         message += `🔗 [Full story](${item.link}) | 📺 ${this.escapeMarkdown(item.source)}\n\n`;
  //       });
  //     }
  //   }

  //   message += "\nFor real-time updates, follow @Notifycast+";
  //   return message;
  // }

  formatDailyDigest(categories) {
    let message = "🗞 *Daily News Digest* 🗞\n\n";

    for (const [category, news] of Object.entries(categories)) {
      if (news.length > 0) {
        const emoji = this.emojiMap[category] || "📌";
        message += `*${emoji} ${this.escapeMarkdown(this.capitalizeFirstLetter(category))} Highlights:*\n\n`;
        news.slice(0, 5).forEach((item, index) => {
          message += `${index + 1}\\. *${this.escapeMarkdown(item.title)}*\n`;
          message += `${this.escapeMarkdown(this.truncate(item.summary, 200))}\n`;
          message += `[Full story](${item.link}) \\| 📺${this.escapeMarkdown(item.source)}\n\n`;
        });
      }
    }

    message += "\nFor real\\-time updates, follow @Notifycast";
    return message;
  }

  escapeMarkdown(text) {
    const specialChars = [
      "_",
      "*",
      "[",
      "]",
      "(",
      ")",
      "~",
      "`",
      ">",
      "#",
      "+",
      "-",
      "=",
      "|",
      "{",
      "}",
      ".",
      "!",
    ];
    return text
      .split("")
      .map((char) => {
        if (specialChars.includes(char)) {
          return "\\" + char;
        }
        return char;
      })
      .join("");
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  truncate(text, length) {
    return text.length > length ? text.substring(0, length - 3) + "..." : text;
  }

  convertHtmlToMarkdown(html) {
    return turndownService.turndown(html);
  }
}

export default new NewsFormatter();
