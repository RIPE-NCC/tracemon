
/*
 * This is just to keep track of the event names and their object types
 *
 */

utils.observer.publish("ready", status);
utils.observer.publish("error", { type: "", message: ""});


utils.observer.publish("view:probe-set", [Probe]);
utils.observer.publish("view:max-hops", Integer);
utils.observer.publish("view.traceroute:mousein", Traceroute);
utils.observer.publish("view.traceroute:mouseout", Traceroute);
utils.observer.publish("view.traceroute:click", Traceroute);
utils.observer.publish("view.traceroute.search-results:change", Traceroute);
utils.observer.publish("view.traceroute.search-results:new", Traceroute);
utils.observer.publish("view.traceroute.search:new", Traceroute);
utils.observer.publish("view.status:change", {msm: {source:Tracroute}});
utils.observer.publish("view.animation:stop", Moment);
utils.observer.publish("view.animation:start", Moment);
utils.observer.publish("view.label-level:change", Moment);
utils.observer.publish("view.time-selection:change", { startDate: Moment, stopDate: Moment });
utils.observer.publish("view.current-instant:change", Moment);


utils.observer.publish("model.ready", return getModel());
utils.observer.publish("model.host:new", Host);
utils.observer.publish("model.host:change", Host);
utils.observer.publish("model.measurement:new", Measurement); // We have a new measurement metadata object (no results)
utils.observer.publish("model.measurement:removed", Integer); // the msmId was removed (no obj instance anymore)
utils.observer.publish("model.history:new", null);
utils.observer.publish("model.history:change", null);






