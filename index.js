const { Client, Intents, MessageActionRow } = require('discord.js');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
  ]
});


client.on('messageCreate', async msg => {

  if (msg.content.startsWith("$nick")) {
    const regex = /<@(\d+)>(.*)/;
    const match = msg.content.match(regex);
    
    if (match) {
      const userNumber = match[1];
      const intendedUserNick = match[2].trim();
  
      const guild = await client.guilds.fetch(msg.guildId);
      const user = await guild.members.cache.find(member => member.id === userNumber);

      if (userNumber == msg.author.id) {
        try {
          msg.reply("You can't change your own nickname, silly")
        }
        catch (e) {
          console.log(e)
        }
        
      }
      else if (user.user.bot) {
        try {
          msg.reply("You can't change a bots nickname")
        }
        catch (e) {
          console.log(e)
        }
      }
      else {
        work(user, msg, intendedUserNick);
      }
      
    } else {
      try {
        msg.reply("That didn't work :(. The syntax is $nick (user) (new nickname)");
      }
      catch (e) {
        console.log(e)
      }
    }
  }

  getIntendedName(msg);

});

var namesdb = null;

console.log("OPENING");
open({
  filename: './database',
  driver: sqlite3.Database
}).then(async (db) => {
  console.log("DB CONNECTED");
  const res = await db.all('SELECT * FROM key')
  namesdb = db;
  var key = res[0].key;
  console.log("KEY GOT");
  client.login(key);
  console.log("LOGGED IN")
});

async function work(user, msg, textAfterNumber) {
      try {
        await namesdb.run('DELETE FROM names WHERE GuildID = ? AND UserID = ?', [msg.guildId, user.id])
        await namesdb.run('INSERT INTO names (GuildID, UserID, Nickname) VALUES (?,?,?)', [msg.guildId, user.id, textAfterNumber])
        let oldName = user.nickname;
        await user.setNickname(textAfterNumber, "Funny");
        
        msg.reply("<@" + user.id + "> your nickname has been changed from " + oldName + " :)");
      }
      catch (e) {
        try {
          msg.reply("<@" + user.id + "> change ur nickname to ```" + textAfterNumber + "``` NOW!!! \n (SERVER ADMIN MAKE SURE BOT PERM ROLE IS ABOVE ALL OTHERS)");
        }
        catch(e) {
          console.log(e)
        }
      }
}

async function getIntendedName(msg) {
  guild = msg.guildId;
  user = msg.author.id;
  
  const res = await namesdb.all('SELECT Nickname FROM names WHERE GuildID = ? AND UserID = ?', guild, user)
 
  if (res.length > 0 ) {
    const name = res[0].Nickname
    const guild = await client.guilds.fetch(msg.guildId);
    
    const nuser = await guild.members.cache.find(member => member.id === user);
    
    if (!nuser.user.bot && (nuser.nickname == null || nuser.nickname.toLowerCase().trim() != name.toLowerCase().trim())) {
      work(nuser, msg, name)
    }
  
  }
}
