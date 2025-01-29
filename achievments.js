const stringSimilarity = require('string-similarity');

// Configuration for word sets and achievements
const wordSets = [
    {
        words: ['secte', 'sectes'],
        achievement: 'sectaire',
        threshold: 0.8,
        requiredCount: 2
    },
    {
        words: ['dieu', 'dieux', 'divin'],
        achievement: 'touchée par le divin',
        threshold: 0.8,
        requiredCount: 2
    },
    {
        words: ['pipi', 'caca', 'eupho'],
        achievement: 'Euphoriazouz',
        threshold: 0.8,
        requiredCount: 3 
    },
    {
        words: ['glitteryglitch', 'patate', 'gueuse'],
        achievement: 'glitteryzouz',
        threshold: 0.8,
        requiredCount: 3
    },
    {
        words: ['terrestrine', 'feufeuille', 'terre'],
        achievement: 'feuillu',
        threshold: 0.8,
        requiredCount: 3
    },
    // Add more word sets here as needed
];

// List of titles
const titles = [
    "BarBarista",
    "Barbardeur",
    "Barbarracuda",
    "Barbarbecue",
    "Barbartiste",
    "Barbarpapa",
    "just a girl",
    "créature du bosquet",
    "créature de l'obscurité derrière la station service",
    "gobelin de marchés",
    "coureuse de remparts",
    "petit loukoum",
    "falafel d'amour",
    "héroïne du royaume de OOO",
    "kirby cosplayer",
    "ANOMALY",
    "twitchbot"
];

const items = [
    "Épée", "Bouclier", "Amulette", "Anneau", "Casque", "Armure", "Bottes", "Gants", "Cape", "Bâton"
];

const natures = [
    "obsidienne", "honte", "feu", "glace", "vent", "terre", "éclair", "ombre", "lumière", "eau"
];

// Function to check achievements
function checkAchievements(user, message, userActivityData, client, channel) {
    // Ensure userActivityData is defined and has the necessary properties
    if (!userActivityData || !userActivityData.messages) {
        return;
    }

    // Example achievement check: First message achievement
    if (userActivityData.messages.length === 1) {
        if (!userActivityData.achievements.includes('First Message')) {
            userActivityData.achievements.push('First Message');
            client.say(channel, `${user} a gagné le badge "First Message" !`);
        }
    }

    // Example achievement check: Polite achievement
    checkPoliteAchievement(user, message, userActivityData, client, channel);

    // Check for word set achievements
    checkWordSetAchievements(user, message, userActivityData, client, channel);

    // Add more achievement checks here
}

function checkPoliteAchievement(user, message, userActivityData, client, channel) {
    const politeWords = ["bonjour", "bonsoir", "salut", "hello", "coucou"];
    politeWords.forEach(word => {
        const similarity = stringSimilarity.compareTwoStrings(message.toLowerCase(), word);
        if (similarity > 0.8 && !userActivityData.achievements.includes('Polite')) {
            userActivityData.achievements.push('Polite');
            client.say(channel, `${user} a gagné le badge "Polite" !`);
        }
    });
}

function checkWordSetAchievements(user, message, userActivityData, client, channel) {
    wordSets.forEach(set => {
        set.words.forEach(word => {
            const similarity = stringSimilarity.compareTwoStrings(message.toLowerCase(), word);
            if (similarity > set.threshold) {
                if (!userActivityData.wordUsage[set.achievement]) {
                    userActivityData.wordUsage[set.achievement] = 0;
                }
                userActivityData.wordUsage[set.achievement]++;
                if (userActivityData.wordUsage[set.achievement] >= set.requiredCount && !userActivityData.achievements.includes(set.achievement)) {
                    userActivityData.achievements.push(set.achievement);
                    client.say(channel, `${user} a gagné le badge "${set.achievement}" !`);
                }
            }
        });
    });
}

module.exports = {
    wordSets,
    checkAchievements,
    titles // Export titles
};