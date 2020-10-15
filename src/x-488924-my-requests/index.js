import { createCustomElement } from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import styles from './styles.scss';
import view from './view';
import actionHandlers from './actionHandlers'

createCustomElement('x-488924-my-requests', {
	renderer: { type: snabbdom },
	view,
	initialState: {
		loading: true,
		userID: '',
		ritms: []
	},
	actionHandlers,
	styles
});
