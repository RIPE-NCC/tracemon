
/*
 * Copyright (c) 2016 RIPE NCC
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */


utils.observer.publish("view:probe-set", [Probe]);
utils.observer.publish("view:max-hops", Integer);
utils.observer.publish("view.traceroute:mousein", Traceroute);
utils.observer.publish("view.traceroute:mouseout", Traceroute);
utils.observer.publish("view.traceroute:click", Traceroute);
utils.observer.publish("view.traceroute:filter-in", Traceroute);
utils.observer.publish("view.traceroute:filter-out", Traceroute);
utils.observer.publish("view.status:change", {msm: {source:Tracroute}});
utils.observer.publish("view.animation:stop", Moment);
utils.observer.publish("view.animation:start", Moment);
utils.observer.publish("view.time-selection:change", { startDate: Moment, stopDate: Moment });
utils.observer.publish("view.current-instant:change", Moment);


utils.observer.publish("model.host:as", ModelObject);
utils.observer.publish("model.host:ixp", ModelObject);
utils.observer.publish("model.host:new", Host);
utils.observer.publish("model.measurement:new", Measurement);
utils.observer.publish("model.history:new", null);
utils.observer.publish("model.history:change", null);






