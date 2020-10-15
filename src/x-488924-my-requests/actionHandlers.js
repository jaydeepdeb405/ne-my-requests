import { createHttpEffect } from '@servicenow/ui-effect-http';
import { actionTypes } from '@servicenow/ui-core';
import RecordWatcher from '../RecordWatcher';

// required fields for sc_req_item
const FIELDS = [
    'number', 
    'cat_item', 
    'cat_item.picture', 
    'request', 
    'stage', 
    'due_date', 
    'price', 
    'quantity', 
    'recurring_price', 
    'recurring_frequency', 
    'opened_at', 
    'sys_id'
];
// alert auto close duration in millis
const ALERT_DISMISS = 5000;
// alert types
const ALERT_COLORS = {
    RED: 'critical',
    BLUE: 'info',
    GREEN: 'positive'
};

/** 
 * dispatches action to fetch userID on component bootstrap
 */
function handleComponentBootstrapped({ dispatch }) {
    dispatch('CURRENT_USER_ID_FETCH');
}

/** 
 * helper method to display now-alert
 * @param {string} - status. alert type value from ALERT_COLORS
 * @param {string} - content. alert message content
 * @param {string} - icon. alert icon name
 */
function displayAlert({ state, updateState }, status, content, icon) {
    clearTimeout(state.alertTimeout);
    updateState({
        alert: {
            icon: icon || 'info-circle-outline',
            status,
            content
        },
        alertTimeout: setTimeout(() => updateState({ alert: undefined }), ALERT_DISMISS)
    })
}

/** 
 * helper method to get simple date & time ago from date time values
 * @param {object} - ritm. ritm record
 * @returns {object} - ritm. updated ritm record
 */
function formatRITM(ritm) {
    ritm.due_date.simple_date = ritm.due_date.display_value ? ritm.due_date.display_value.match(/\d{4}-\d{2}-\d{2}/)[0] : '';
    ritm.opened_at.simple_date = ritm.opened_at.display_value ? ritm.opened_at.display_value.match(/\d{4}-\d{2}-\d{2}/)[0] : '';
    ritm.opened_at.time_ago = timeAgo(ritm.opened_at.value);
    return ritm;
}

/** 
 * helper method to format each ritm record
 * @param {Array} - ritms. ritms record array
 * @returns {Array} - ritms. updated ritms Array
 */
function formatReponse(ritms) {
    return ritms.map(ritm => formatRITM(ritm));
}

/** 
 * helper method to calculate time ago
 * @param {string} - date. UTC date in date time format
 * @returns {string} - time ago
 */
function timeAgo(date) {
    const secondsAgo = Math.round((new Date() - new Date(`${date} UTC`)) / 1000);

    let interval = Math.round(secondsAgo / 31536000);
    if (interval > 1) return interval + " year" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.round(secondsAgo / 2592000);
    if (interval > 1) return interval + " month" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.round(secondsAgo / 86400);
    if (interval > 1) return interval + " day" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.round(secondsAgo / 3600);
    if (interval > 1) return interval + " hour" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.round(secondsAgo / 60);
    if (interval > 1) return interval + " min" + (interval > 1 ? "s" : "") + " ago";
    return (secondsAgo > 0 ? secondsAgo : 0) + " second" + (secondsAgo > 1 ? "s" : "") + " ago";
}

export default {
    [actionTypes.COMPONENT_BOOTSTRAPPED]: handleComponentBootstrapped,
    'CURRENT_USER_ID_FETCH': createHttpEffect("/api/488924/gs/getUserID", {
        method: 'GET',
        successActionType: 'CURRENT_USER_ID_SUCCESS',
        errorActionType: 'CURRENT_USER_ID_ERROR'
    }),
    // fetch current user's ritms & init record watcher
    'CURRENT_USER_ID_SUCCESS': ({ action, dispatch, updateState }) => {
        const userID = action.payload.result;
        const query = `active=true^request.requested_for=${userID}`;
        updateState({ userID, query });
        dispatch('MY_RITMS_FETCH', {
            sysparm_fields: FIELDS.join(','),
            sysparm_query: query,
            sysparm_display_value: 'all',
            sysparm_exclude_reference_link: true
        });
        new RecordWatcher().watch('sc_req_item', query, (response) => dispatch('RECORD_WATCHER_CALLBACK', { response }));
    },
    'CURRENT_USER_ID_ERROR': (coeffects) => {
        const { action, updateState } = coeffects;
        updateState({ loading: false });
        displayAlert(coeffects, ALERT_COLORS.RED, action.payload.data.error.message);
    },
    'MY_RITMS_FETCH': createHttpEffect("/api/now/table/sc_req_item", {
        method: 'GET',
        queryParams: ['sysparm_fields', 'sysparm_query', 'sysparm_display_value', 'sysparm_exclude_reference_link'],
        successActionType: 'MY_RITMS_SUCCESS',
        errorActionType: 'MY_RITMS_ERROR'
    }),
    'MY_RITMS_SUCCESS': (coeffects) => {
        const { action, updateState } = coeffects;
        const ritms = formatReponse(action.payload.result);
        updateState({ ritms, loading: false });
    },
    'MY_RITMS_ERROR': ({ action, updateState }) => {
        const { payload } = action;
        if (payload.hasOwnProperty('data') && payload.data.hasOwnProperty('error') && payload.data.error.hasOwnProperty('message')) {
            displayAlert(coeffects, ALERT_COLORS.RED, payload.data.error.message);
        }
        updateState({ loading: false });
    },
    // now-text-link handler - opens request record in workspace/ritm record in modal
    'NOW_TEXT_LINK#CLICKED': ({ action, dispatch, updateState }) => {
        action.payload.ritm ?
            updateState({ openRitm: action.payload.ritm }) :
            dispatch('PREVIEW_RECORD', {
                table: "sc_request",
                sys_id: action.payload.request
            });
    },
    // action handler for now-modal close button
    'NOW_MODAL#OPENED_SET': ({ updateState }) => {
        updateState({ openRitm: undefined });
    },
    // callback for record watcher
    'RECORD_WATCHER_CALLBACK': ({ action, state, dispatch, updateState }) => {
        const response = action.payload.response;
        const { data } = response;
        const { sys_id, operation, changes, record } = data;
        // fetch inserted record from api
        if (operation === 'insert') {
            updateState({ loading: true });
            dispatch('RITM_FETCH_BY_ID', {
                sysparm_fields: FIELDS.join(','),
                sys_id,
                sysparm_query: state.query,
                sysparm_display_value: 'all',
                sysparm_exclude_reference_link: true
            });
        }
        // update the record in state
        else if (operation === 'update' &&
            changes instanceof Array &&
            changes.length > 0) {
            const ritms = state.ritms.map(ritm => {
                if (ritm.sys_id.value === sys_id) {
                    Object.keys(record).forEach(fieldName => {
                        if (FIELDS.indexOf(fieldName) > -1) ritm[fieldName] = record[fieldName];
                    });
                    ritm = formatRITM(ritm);
                }
                return ritm;
            });
            updateState({ ritms });
        }
        // remove deleted record from state
        else if (operation === 'delete') {
            const ritms = state.ritms.filter(ritm => ritm.sys_id.value !== sys_id);
            updateState({ ritms });
        }
    },
    // fetch a ritm record by sys_id (used by record watcher callback)
    'RITM_FETCH_BY_ID': createHttpEffect("/api/now/table/sc_req_item/:sys_id", {
        method: 'GET',
        pathParams: ['sys_id'],
        queryParams: ['sysparm_fields', 'sysparm_query', 'sysparm_display_value', 'sysparm_exclude_reference_link'],
        successActionType: 'RITM_FETCH_BY_ID_SUCCESS',
        errorActionType: 'RITM_FETCH_BY_ID_ERROR'
    }),
    'RITM_FETCH_BY_ID_SUCCESS': ({ action, state, updateState }) => {
        let { ritms } = state;
        ritms.push(formatRITM(action.payload.result));
        updateState({ ritms, loading: false });   
    },
    'RITM_FETCH_BY_ID_ERROR': ({ updateState }) => {
        updateState({ loading: false });   
    }
}