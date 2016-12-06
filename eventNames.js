
/*
 * This is just to keep track of the event names and their object types
 *
 */


utils.observer.publish("view:probe-set", [Probe]);
utils.observer.publish("view:max-hops", Integer);
utils.observer.publish("view.traceroute:mousein", Traceroute);
utils.observer.publish("view.traceroute:mouseout", Traceroute);
utils.observer.publish("view.traceroute:click", Traceroute);
utils.observer.publish("view.traceroute.search:change", Traceroute);
utils.observer.publish("view.status:change", {msm: {source:Tracroute}});
utils.observer.publish("view.animation:stop", Moment);
utils.observer.publish("view.animation:start", Moment);
utils.observer.publish("view.label-level:change", Moment);
utils.observer.publish("view.time-selection:change", { startDate: Moment, stopDate: Moment });
utils.observer.publish("view.current-instant:change", Moment);


utils.observer.publish("model.host:as", ModelObject);
utils.observer.publish("model.host:ixp", ModelObject);
utils.observer.publish("model.host:new", Host);
utils.observer.publish("model.measurement:new", Measurement);
utils.observer.publish("model.history:new", null);
utils.observer.publish("model.history:change", null);






