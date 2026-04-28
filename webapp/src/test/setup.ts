import i18n from '../i18n';
import { beforeAll } from 'vitest';

beforeAll(async () => {
	await i18n.changeLanguage('es');
});
