import { createCustomElement } from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import styles from './styles.scss';
import view from './view';

createCustomElement('ritm-modal', {
	renderer: { type: snabbdom },
	view,
	properties: {
		ritm: {
            default: {}
        }
	},
	styles
});
