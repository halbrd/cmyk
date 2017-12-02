const {join} = require('path');
const Discord = require('discord.js');
const requireAll = require('require-all');

const logger = require('./utils/logger');
const config = require('./config');

const plugins = requireAll({
	dirname: join(__dirname, '/plugins'),
	filter: /(index)\.js$/,
	excludeDirs: /^\.(git|svn)$/,
	recursive: true,
	resolve: Plugin => {
		return new Plugin();
	}
});

class Core {
	constructor() {
		this.validateconfig(config);
	}
	async run() {
		this.client = new Discord.Client();
		await this.connect();
	}

	async load() {
		logger.logInfo('Loading plugins and setting up...');
		await this.setPresence();
		// TODO: Setup Database
		// TODO: Register events
		this.plugins = Object.keys(plugins).map(key => plugins[key].index);
		this.registerPlugins();
		this.setupMessageHandlers();
		this.compileHelp();
		logger.logInfo('Done!');
	}

	async setPresence() {
		return this.client.user.setPresence({
			status: 'online',
			afk: false,
			game: {
				name: config.DISCORD_STATUS,
				url: 'https://g.hu.md/hugo/aqua'
			}
		});
	}

	registerPlugins() {
		logger.logInfo('> Registering plugins..');
		this.plugins.map(plugin => plugin.register(this.client));
	}

	compileHelp() {
		logger.logInfo('> Compiling help..');
		let helpText = '';
		const pluginHelp = {};
		this.plugins.forEach(plugin => {
			const pluginconfig = plugin.config();
			helpText += `
**${pluginconfig.name}**
${pluginconfig.help}
`;
			pluginHelp[pluginconfig.name] = pluginconfig.help;
		});
		this.client.helpText = helpText;
		this.client.pluginHelp = pluginHelp;
	}

	async connect() {
		// TODO: Connect to Postgres
		// Connect to Discord
		return this.client.login(config.DISCORD_TOKEN).then(async () => {
			logger.logSuccess('> Connected');
			logger.logInfo('> Loading bot..');
			await this.load();
		});
	}

	setupMessageHandlers() {
		logger.logInfo('Setting up message handler..');

		this.client.on('message', msg => {
			if (
        !msg.content.match(new RegExp('^\\' + config.DISCORD_PREFIX + '\\w+'))
      ) {
				return;
			}
			if (msg.author.bot) {
				return;
			}
			logger.logMsg(msg);
			this.client.emit('pluginmessage', msg);
		});
	}

	validateconfig(config) {
		logger.logInfo('> Validating config..');
		const undefConf = [];
		Object.keys(config).forEach(key => {
			if (config[key] === undefined) {
				undefConf.push(key);
			}
		});
		if (undefConf.length > 0) {
			undefConf.map(key =>
				logger.logError(`> ${key} environment variable undefined.`)
			);
			throw new Error('All config variables must be defined');
		}
	}
}

module.exports = Core;
