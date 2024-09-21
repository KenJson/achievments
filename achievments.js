const tmi = require('tmi.js');
const fs = require('fs');
const path = require('path');
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

// Function to check achievements
function checkAchievements(user, message, client, channel) {
	let currentTime = new Date();
	let userActivityData = userActivity[user];

	// List of polite words
	const politeWords = ['bonjour', 'bonsoir', 'salut', 'hello', 'coucou'];

	// Night Owl Achievement
	if ((currentTime.getHours() >= 23 || currentTime.getHours() < 6) && !userActivityData.achievements.includes("Oiseau de nuit")) {
		client.say(channel, `${user} a gagné le badge "Oiseau de nuit" !`);
		userActivityData.achievements.push("Oiseau de nuit");
	}

	// Polite Achievement
	if (userActivityData.messages.length === 1 && politeWords.some(word => message.toLowerCase().includes(word)) && !userActivityData.achievements.includes("Poli")) {
		client.say(channel, `${user} a gagné le badge "Poli" !`);
		userActivityData.achievements.push("Poli");
	}

	// Chatterbox Achievement
	if (userActivityData.messages.length === 10 && !userActivityData.achievements.includes("Bavard")) {
		client.say(channel, `${user} a gagné le badge "Bavard" !`);
		userActivityData.achievements.push("Bavard");
	}

	// Early Bird Achievement
	if ((currentTime.getHours() >= 6 && currentTime.getHours() < 9) && !userActivityData.achievements.includes("Lève-tôt")) {
		client.say(channel, `${user} a gagné le badge "Lève-tôt" !`);
		userActivityData.achievements.push("Lève-tôt");
	}

	// Loyal Viewer Achievement (active for at least 30 minutes)
	const activeDuration = (currentTime - new Date(userActivityData.firstMessageTime)) / (1000 * 60); // Duration in minutes
	if (activeDuration >= 30 && !userActivityData.achievements.includes("Spectateur fidèle")) {
		client.say(channel, `${user} a gagné le badge "Spectateur fidèle" !`);
		userActivityData.achievements.push("Spectateur fidèle");
	}

	// Save user activity after checking achievements
	saveUserActivity();
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
			achievements: []
		};
	}
	userActivity[user].messages.push({ content: message, time: currentTime });

	// Check for achievements
	checkAchievements(user, message, client, channel);

	// Display achievements command
	if (message.toLowerCase() === '!achievements') {
		let achievements = userActivity[user].achievements.join(', ');
		if (achievements.length === 0) {
			achievements = 'Aucun badge gagné pour le moment.';
		}
		client.say(channel, `${user}, vos badges: ${achievements}`);
	}
});

// Connect to Twitch
client.connect().catch(console.error);