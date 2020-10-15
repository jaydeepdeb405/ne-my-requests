export default (state) => {
    const { ritm } = state.properties;
    return (<now-modal
        size="md"
        headerLabel={ritm.number.display_value}
        opened={true}
        manageOpened={true}>
        <div className="modal-content">
            <div className="modal-left">
                <div className="ritm-attrs">
                    <div>{ritm.cat_item.display_value}</div>
                    <div>Submitted : {ritm.opened_at.simple_date}</div>
                    <div>Delivery : {ritm.due_date.simple_date}</div>
                </div>
                {ritm['cat_item.picture'].display_value ?
                    <img className="cat-img" src={ritm['cat_item.picture'].display_value} /> : null
                }
            </div>
            <div className="modal-right">
                <now-text-link
                    append-to-payload={{ request: ritm.request.value }}
                    label={ritm.request.display_value}
                    href="javascript: void(0)"
                    variant="primary">
                </now-text-link>
                <now-highlighted-value
                    label={ritm.stage.display_value}
                    status="info">
                </now-highlighted-value>
                <div className="ritm-attrs">
                    <div>Quantity: {ritm.quantity.display_value}</div>
                    <div>Price (ea.): {ritm.price.display_value || ''}</div>
                    {ritm.recurring_frequency.display_value ?
                        <div>{`+ ${ritm.recurring_price.display_value} ${ritm.recurring_frequency.display_value}`}</div>
                        : null
                    }
                </div>
            </div>
        </div>
    </now-modal>);
}