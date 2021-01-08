const fetch = require('node-fetch');
const fs = require('fs');
const Discord = require('discord.js');

let config = {};
try {
  const configRaw = fs.readFileSync('config.json');
  config = JSON.parse(configRaw);
} catch (e) {
  console.log(`Failed to parse config: ${e}`);
  process.exit(1);
}

const discordClient = new Discord.Client();
const discordToken = config.discordToken;

const redditUrl = 'https://www.reddit.com/r/';
const redditMediaDomainWhitelist = ['https://redgifs.com', 'https://gfycat.com', 'https://v.redd.it'];
const redditMediaExtensionWhitelist = ['.jpg', '.jpeg', '.gifv', '.gif'];
discordClient.login(discordToken);

discordClient.on("ready", () => {
  console.log("Ready!");
});

const filterRedditResponse = (({ json }) => {
  return json.filter(post => {
    const url = post.data.url;

    let found = false;
    redditMediaDomainWhitelist.forEach(domain => {
      if (!found && url.includes(domain)) {
        found = true;
      }
    });
    redditMediaExtensionWhitelist.forEach(extension => {
      if (!found && url.endsWith(extension)) {
        found = true;
      }
    });

    return found;
  });
});

const redditRequest = async ({ subreddit, msg }) => {
  if (!config.discordChannelWhitelist.includes(msg.channel.id)) return Promise.resolve();

  const result = await fetch(redditUrl + subreddit + '.json');
  if (result.status !== 200) {
    if (result.status === 404) {
      msg.channel.send("Subreddit not found");
    } else {
      msg.channel.send(`Request to reddit failed: \n\`\`\`Markdown\nURL: ${result.url}\nStatus: ${result.status}, ${result.statusText}\`\`\``);
    }
    return Promise.resolve();
  }

  const body = await result.json();
  let json = body.data.children;
  if (json.length == 0) {
    msg.channel.send('Subreddit is empty');
    return Promise.resolve();
  }

  const contentList = filterRedditResponse({ json });

  if (contentList.length == 0) {
    msg.channel.send('Nothing found');
    return Promise.resolve();
  }

  const post = contentList[Math.floor(Math.random() * contentList.length)];
  return msg.channel.send(post.data.url);
}

discordClient.on('message', async msg => {
  // filter messages posted from bot
  if (msg.author.bot) return;

  if (!msg.content.startsWith('r!')) return;

  const subreddit = msg.content.split('r!')[1];
  await redditRequest({ subreddit, msg });
});
