const fetch = require('node-fetch');
const { Client, MessageAttachment } = require('discord.js');

// DISCORD
var client = new Client();
const token = 'Nzk3MDkyMjg4NjAxMjYwMDQ0.X_hcCg.tOBo_tug88CGrOnEG3N-LAA-Qd8';

const redditUrl = 'https://www.reddit.com/r/';

client.login(token);

client.on("ready", () => {
  console.log("Ready!");
});

const redditRequest = async ({ subreddit, msg }) => {
  const result = await fetch(redditUrl + subreddit + '.json');
  if (result.status !== 200) {
    if (result.status === 404) {
      msg.channel.send("Subreddit not found");
      return;
    }
    msg.channel.send(`Request to reddit failed: \n\`\`\`Markdown\nURL: ${result.url}\nStatus: ${result.status}, ${result.statusText}\`\`\``);
  }
  const body = await result.json();
  let json = body.data.children;
  if (json.length == 0) {
    msg.channel.send('Subreddit is empty');
  } else {
    //get content
    let contentList = [];
    for (let i = 0; i < json.length; i++) {
      console.log(json[i].data.url);
      if (json[i].data.url.endsWith('.jpg') || json[i].data.url.endsWith('.jpeg') || json[i].data.url.endsWith('.gifv') || json[i].data.url.endsWith('.gif')
        || json[i].data.url.startsWith('https://redgifs.com')) {
        contentList.push(json[i].data.url);
      }
    }

    if (contentList.length == 0) {
      msg.channel.send('Nothing found');
    }
    else {
      //decide random
      const file = contentList[Math.floor(Math.random() * contentList.length)];
      const attachment = new MessageAttachment(file);
      msg.channel.send(attachment);
    }
  }
}


client.on('message', async msg => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith('r!')) return;

  const subreddit = msg.content.split('r!')[1];
  await redditRequest({ subreddit, msg });
});
