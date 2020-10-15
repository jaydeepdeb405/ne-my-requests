import '@servicenow/now-loader';
import '@servicenow/now-alert';
import '@servicenow/now-card';
import '@servicenow/now-input';
import '@servicenow/now-button';
import '@servicenow/now-text-link';
import '@servicenow/now-icon';
import '@servicenow/now-highlighted-value';
import '@servicenow/now-heading';
import '@servicenow/now-modal';
import '../ritm-modal';

export default (state) => {
	const { ritms, alert, loading, openRitm } = state;
	return (
		<div>
			{alert ?
				<now-alert
					status={alert.status}
					icon={alert.icon}
					content={alert.content}
					action={{ "type": "dismiss" }}>
				</now-alert> :
				null
			}
			<now-heading label="My Requests" variant="header-secondary"></now-heading>
			{loading ?
				<now-loader
					label="Loading..."
					size="lg">
				</now-loader> :
				<div className="card-wrapper">
					{ritms.length > 0 ?
						ritms.map((ritm, index) => {
							return <now-card
								size="lg"
								key={index}
								interaction="none">
								<div className="card-top">
									<now-text-link
										append-to-payload={{ ritm }}
										label={ritm.cat_item.display_value}
										href="javascript: void(0)"
										variant="primary">
									</now-text-link>
									<now-highlighted-value
										label={ritm.stage.display_value}
										status="info">
									</now-highlighted-value>
								</div>
								<div className="card-bottom">
									{ritm['cat_item.picture'].display_value ?
										<img className="cat-img" src={ritm['cat_item.picture'].display_value} /> : null
									}
									<div className="ritm-attrs">
										<div>{ritm.number.display_value}</div>
										<div>{ritm.opened_at.time_ago}</div>
									</div>
								</div>
							</now-card>
						}) :
						<now-card size="lg" interaction="none">
							<div className="card-body justify-center">No open requests</div>
						</now-card>
					}
				</div>
			}
			{openRitm ?
				<ritm-modal ritm={openRitm} /> :
				null
			}
		</div>
	);
};