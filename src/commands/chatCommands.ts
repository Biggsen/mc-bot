import type { Bot } from "mineflayer";

const MAX_CHAT_LENGTH = 256;

function sendLong(bot: Bot, text: string): void {
  if (text.length <= MAX_CHAT_LENGTH) {
    bot.chat(text);
    return;
  }
  const chunks = text.split(", ");
  let buf = "";
  for (const c of chunks) {
    if (buf.length + c.length + 2 > MAX_CHAT_LENGTH) {
      if (buf) bot.chat(buf.trimEnd().replace(/,\s*$/, ""));
      buf = c;
    } else {
      buf += (buf ? ", " : "") + c;
    }
  }
  if (buf) bot.chat(buf.trimEnd().replace(/,\s*$/, ""));
}

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
    if (trimmed === "where" || trimmed === "pos") {
      const p = bot.entity.position;
      bot.chat(`I'm at ${Math.floor(p.x)}, ${Math.floor(p.y)}, ${Math.floor(p.z)}`);
      return;
    }
    if (trimmed === "hp" || trimmed === "health") {
      bot.chat(`Health ${bot.health}/20, food ${bot.food}/20${bot.health === 0 ? " (dead)" : ""}`);
      return;
    }
    if (trimmed === "inv" || trimmed === "inventory") {
      const items = bot.inventory.items();
      const list = items.map((i) => `${i.name} x${i.count}`).join(", ");
      sendLong(bot, list || "Inventory empty");
      return;
    }
    if (trimmed === "held") {
      const item = bot.heldItem;
      bot.chat(item ? `${item.name} x${item.count}` : "Nothing in hand");
      return;
    }
    if (trimmed === "gm" || trimmed === "gamemode") {
      const mode = bot.game?.gameMode ?? "unknown";
      bot.chat(`Gamemode: ${mode}`);
      return;
    }
    if (trimmed === "xp" || trimmed === "experience" || trimmed === "level") {
      bot.chat(`Level ${bot.experience?.level ?? 0}, ${bot.experience?.points ?? 0} XP`);
      return;
    }
    if (trimmed === "players") {
      const names = Object.keys(bot.players).filter((n) => n !== bot.username);
      sendLong(bot, names.length ? names.join(", ") : "No other players visible");
      return;
    }
    if (trimmed === "dim" || trimmed === "dimension") {
      const dim = bot.game?.dimension ?? "unknown";
      bot.chat(`Dimension: ${dim}`);
      return;
    }
    if (trimmed === "status") {
      const p = bot.entity.position;
      const mode = bot.game?.gameMode ?? "?";
      const dim = bot.game?.dimension ?? "?";
      bot.chat(
        `At ${Math.floor(p.x)},${Math.floor(p.y)},${Math.floor(p.z)} | ${mode} | ${dim} | HP ${bot.health} Food ${bot.food}`
      );
      return;
    }
    if (trimmed === "help" || trimmed === "commands") {
      bot.chat(
        "ping, hello, where/pos, hp, inv, held, gm, xp, players, dim, status, help"
      );
      return;
    }
  });
}
