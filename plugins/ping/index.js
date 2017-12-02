const config = require('../../config');
const BasePlugin = require('../plugin-base.js');

class Ping extends BasePlugin {
	constructor() {
		super();
		this.conf = {
			name: 'ping',
			help: `\`${config.DISCORD_PREFIX}ping\` responds with pong`,
			regex: new RegExp(`^${config.DISCORD_PREFIX}ping`)
		};
	}
	async handler(msg) {
		super.handler(msg);
		msg
			.reply('Pinging...')
			.then(sentMsg => {
				const fromDate = sentMsg.createdTimestamp;
				const toDate = msg.editedTimestamp || msg.createdTimestamp;
				sentMsg.edit(
					`Pong! Took ${fromDate - toDate} ms.`
				);
			});
	}

	config() {
		return this.conf;
	}
}

module.exports = Ping;
