const tmi = require('tmi.js');
const fs = require('fs');
const path = require('path');
const { wordSets, checkAchievements, titles, items, natures } = require('./achievments'); // Import items and natures from achievments.js
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

// Function to get a random title from the titles list
function getRandomTitle() {
    return titles[Math.floor(Math.random() * titles.length)];
}

// Function to get a random item composed of one element from items and one from natures
function getRandomItem() {
    const item = items[Math.floor(Math.random() * items.length)];
    const nature = natures[Math.floor(Math.random() * natures.length)];
    return `${item} de ${nature}`;
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
            wordUsage: {},
            title: null,
            item: null
        };
    }
    userActivity[user].messages.push({ content: message, time: currentTime });

    // Check for achievements
    checkAchievements(user, message, userActivity[user], client, channel);

    // Assign title based on the number of achievements
    const achievementsCount = userActivity[user].achievements.length;
    if (achievementsCount >= 5 && !userActivity[user].title) {
        userActivity[user].title = getRandomTitle();
        client.say(channel, `${user} a reçu le titre "${userActivity[user].title}" pour avoir obtenu 5 réalisations !`);
    }

    // Award item based on the number of achievements
    if (achievementsCount >= 10 && !userActivity[user].item) {
        userActivity[user].item = getRandomItem();
        client.say(channel, `${user} a reçu l'objet "${userActivity[user].item}" pour avoir obtenu 10 réalisations !`);
    }

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
            client.say(channel, `${user}, vous n'avez pas encore de réalisations.`);
        } else {
            client.say(channel, `${user}, vos réalisations: ${achievementsList}`);
        }
    }

    // Save user activity data after handling the message
    saveUserActivity();
});

// Connect to Twitch
client.connect().catch(console.error);