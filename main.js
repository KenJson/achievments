const tmi = require('tmi.js');
const fs = require('fs');
const path = require('path');
const {
    wordSets,
    checkAchievements
} = require('./achievements');
require('dotenv').config({ path: './credentials.env' }); // Load environment variables from credentials.env

// Path to the JSON file
const dataFilePath = path.join(__dirname, 'userActivity.json');

// Load user activity from the JSON file
let userActivity = {};
if (fs.existsSync(dataFilePath)) {
    userActivity = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
}

// Function to save user activity to the JSON file
function saveUserActivity() {
    fs.writeFileSync(dataFilePath, JSON.stringify(userActivity, null, 2), 'utf8');
}

// Twitch chat client configuration
const client = new tmi.Client({
    options: { debug: true },
    connection: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: process.env.TWITCH_USERNAME, // Your Twitch username from environment variable
        password: process.env.TWITCH_OAUTH_TOKEN // Your OAuth token from environment variable
    },
    channels: [ process.env.TWITCH_CHANNEL ] // Your Twitch channel name from environment variable
});

// Event: On Chat Message
client.on('message', (channel, tags, message, self) => {
    if (self) return;

    let user = tags['display-name'];
    let currentTime = new Date();

    // Track user activity
    if (!userActivity[user]) {
        userActivity[user] = {
            firstMessageTime: currentTime,
            messages: [],
            achievements: [],
            wordUsage: {}
        };
    }
    userActivity[user].messages.push({ content: message, time: currentTime });

    // Check for achievements
    checkAchievements(user, message, userActivity, client, channel);

    // Display achievements command
    if (message.toLowerCase() === '!achievements' || message.toLowerCase() === '!badges') {
        let achievements = userActivity[user].achievements;
        let totalBadges = 0;
        let achievementsList = achievements.map(achievement => {
            let isWordSetAchievement = wordSets.some(set => set.achievement === achievement);
            if (isWordSetAchievement) {
                totalBadges += 2;
                return `\x1b[32m${achievement}\x1b[0m`; // Green color for word set achievements
            } else {
                totalBadges += 1;
                return achievement;
            }
        }).join(', ');

        if (totalBadges === 0) {
            achievementsList = 'Aucun badge gagné pour le moment.';
        }

        let title = userActivity[user].title ? `Titre: ${userActivity[user].title}\n` : '';
        client.say(channel, `${user}, ${title}Vos badges (${totalBadges}): ${achievementsList}`);
    }

    // Display awarded item command
    if (message.toLowerCase() === '!item') {
        let item = userActivity[user].item;
        if (item) {
            client.say(channel, `${user}, votre objet: ${item}`);
        } else {
            client.say(channel, `${user}, vous n'avez pas encore gagné d'objet.`);
        }
    }
});

// Connect to Twitch
client.connect().catch(console.error);