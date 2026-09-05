require('dotenv').config();
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Бот работает!'));
app.listen(process.env.PORT || 3000, () => console.log('Веб-сервер для Render запущен'));
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Бот работает!'));
app.listen(process.env.PORT || 3000, () => console.log('Веб-сервер для Render запущен'));
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { computeHash } = require('./imageHash');
const BannedStore = require('./bannedStore');

const store = new BannedStore();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel],
});

const SIMILARITY_THRESHOLD = 8; // подбери под себя

client.once('ready', () => {
    console.log(`Бот запущен как ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Команда добавления картинки в бан-лист: !banimg (с прикреплённым файлом)
    if (message.content.startsWith('!banimg')) {
        await handleBanCommand(message);
        return;
    }

    // Проверка всех картинок в обычных сообщениях
    if (message.attachments.size > 0) {
        for (const attachment of message.attachments.values()) {
            if (!attachment.contentType?.startsWith('image/')) continue;

            try {
                const buffer = await downloadImage(attachment.url);
                const hash = await computeHash(buffer);

                if (store.isBanned(hash, SIMILARITY_THRESHOLD)) {
                    await message.delete();
                    const warning = await message.channel.send(
                        `${message.author}, это изображение запрещено к публикации.`
                    );
                    setTimeout(() => warning.delete().catch(() => {}), 5000);
                }
            } catch (err) {
                console.error('Ошибка обработки изображения:', err);
            }
        }
    }
});

async function handleBanCommand(message) {
    if (message.attachments.size === 0) {
        await message.channel.send('Прикрепи изображение к команде !banimg');
        return;
    }

    for (const attachment of message.attachments.values()) {
        if (!attachment.contentType?.startsWith('image/')) continue;

        try {
            const buffer = await downloadImage(attachment.url);
            const hash = await computeHash(buffer);
            store.add(hash);
            await message.channel.send('Изображение добавлено в чёрный список.');
        } catch (err) {
            await message.channel.send('Не удалось обработать изображение.');
            console.error(err);
        }
    }

    await message.delete().catch(() => {});
}

async function downloadImage(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

client.login(process.env.BOT_TOKEN);