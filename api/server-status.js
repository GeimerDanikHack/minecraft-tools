const { getFullInfo } = require('@hloth/minecraft-query'); // [citation:9]

async function getServerStatus(hostname, port = 25565) {
    try {
        const status = await getFullInfo({ hostname, port });
        return {
            online: true,
            players: {
                online: status.players.online,
                max: status.players.max,
                list: status.players.list || []
            },
            version: status.version,
            motd: status.motd,
            latency: status.latency
        };
    } catch (error) {
        return {
            online: false,
            error: error.message
        };
    }
}

module.exports = { getServerStatus };