import type { Bot } from "mineflayer";

export function attachChatCommands(bot: Bot): void {
  bot.on("chat", (username, message) => {
    if (username === bot.username) return;

    const trimmed = message.trim().toLowerCase();

    if (trimmed === "ping") {
      bot.chat("pong");
      return;
    }
    if (trimmed === "hello") {
      bot.chat(`Hello, ${username}!`);
      return;
    }
    if (trimmed === "where") {
      const p = bot.entity.position;
      bot.chat(`I'm at ${p.x.toFixed(0)}, ${p.y.toFixed(0)}, ${p.z.toFixed(0)}`);
      return;
    }
  });
}
