import { settings, SettingsKey } from '../sequelize';
import {
	defaultSettings,
	fromDbValue,
	SettingsObject,
	toDbValue
} from '../settings';

import { GuildCache } from './GuildCache';

export class SettingsCache extends GuildCache<SettingsObject> {
	protected initOne(guildId: string) {
		return { ...defaultSettings };
	}

	protected async _get(guildId: string): Promise<SettingsObject> {
		const sets = await settings.findAll({ where: { guildId } });

		const obj: SettingsObject = { ...defaultSettings };
		sets.forEach(set => (obj[set.key] = fromDbValue(set.key, set.value)));

		return obj;
	}

	public async setOne<K extends SettingsKey>(
		guildId: string,
		key: K,
		value: SettingsObject[K]
	): Promise<SettingsObject[K]> {
		const cfg = await this.get(guildId);
		const dbVal = toDbValue(key, value);
		const val = fromDbValue(key, dbVal);

		// Check if the value changed
		if (cfg[key] !== val) {
			// Save into DB
			settings.bulkCreate(
				[
					{
						id: null,
						guildId,
						key,
						value: dbVal
					}
				],
				{
					updateOnDuplicate: ['value', 'updatedAt']
				}
			);

			cfg[key] = val;
			this.cache.set(guildId, cfg);
		}

		return val;
	}
}
