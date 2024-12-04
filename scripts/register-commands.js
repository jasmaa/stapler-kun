/*
 * Register Discord bot commands
 */

require('dotenv').config();
const fs = require('node:fs');
const axios = require('axios');

const TOKEN = process.env.DISCORD_TOKEN
const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID

const rawData = fs.readFileSync('src/commands.json');
const commands = JSON.parse(rawData);

axios.put(`https://discord.com/api/v10/applications/${APPLICATION_ID}/commands`,
  JSON.stringify(commands), {
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bot ${TOKEN}`,
  },
}).then((response) => {
  console.log(response.data);
});


