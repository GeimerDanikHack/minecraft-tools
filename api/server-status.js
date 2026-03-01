const fetch = require('node-fetch');

async function getServerStatus(hostname, port = 25565) {
    try {
        // Используем публичное API (бесплатно, без ключа)
        const response = await fetch(`https://api.mcsrvstat.us/2/${hostname}`);
        const data = await response.json();
        
        if (data.online) {
            return {
                online: true,
                players: {
                    online: data.players.online,
                    max: data.players.max,
                    list: data.players.list || []
                },
                version: data.version,
                motd: data.motd?.clean?.[0] || 'Minecraft Server',
                latency: data.debug?.ping || 0
            };
        } else {
            return {
                online: false,
                error: 'Сервер оффлайн'
            };
        }
    } catch (error) {
        return {
            online: false,
            error: error.message
        };
    }
}

module.exports = { getServerStatus };