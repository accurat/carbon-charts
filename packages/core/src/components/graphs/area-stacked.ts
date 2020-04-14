// Internal Imports
import { Component } from "../component";
import * as Configuration from "../../configuration";
import { Roles, ScaleTypes, Events, TooltipTypes } from "../../interfaces";
import { Tools } from "../../tools";

// D3 Imports
import { area, stack } from "d3-shape";
import { select, color, sum } from "d3";

import { fromPairs, groupBy, find, map } from "lodash-es";

export class StackedArea extends Component {
	type = "area-stacked";

	areaGenerator: any;

	// TODORF - Remove these listeners in destroy()
	init() {
		// Highlight correct area on legend item hovers
		this.services.events.addEventListener("legend-item-onhover", e => {
			const { hoveredElement } = e.detail;

			this.parent
				.selectAll("g.areas")
				.transition(
					this.services.transitions.getTransition("legend-hover-area")
				)
				.attr("opacity", d => {
					if (d.group !== hoveredElement.datum().group) {
						return Configuration.areas.opacity.unselected;
					}

					return Configuration.areas.opacity.selected;
				});
		});

		// Un-highlight areas on legend item mouseouts
		this.services.events.addEventListener("legend-item-onmouseout", e => {
			this.parent
				.selectAll("g.areas")
				.transition(
					this.services.transitions.getTransition(
						"legend-mouseout-area"
					)
				)
				.attr("opacity", Configuration.areas.opacity.selected);
		});
	}

	getStackedData() {
		const options = this.model.getOptions();
		const datasets = this.model.getDisplayData().datasets;
		const keys: string[] = datasets.map(d => d.label);

		const flattenedData: [] = datasets.flatMap(d =>
			d.data.map(datum => ({
				...datum,
				label: d.label
			}))
		);

		if (options.percentage) {
			const maxByDate = fromPairs(flattenedData.map((d: any) => [d.date, 0]));

			flattenedData.forEach((d: any) => {
				maxByDate[d.date] += d.value;
			});

			// cycle though data values to transform into percentages
			flattenedData.forEach((d: any) => {
				d.value =  d.value / maxByDate[d.date] * 100;
			});
		}

		const preStackData: { [key: string]: number }[] = flattenedData.reduce(
			(acc, cur: any) => {
				const index = acc.findIndex(o =>
					Tools.compareNumeric(o.date, cur.date)
				);

				if (index > -1) {
					acc[index] = { ...acc[index], [cur.label]: cur.value };
				} else {
					acc.push({ date: cur.date, [cur.label]: cur.value });
				}

				return acc;
			},
			[]
		);

		return stack().keys(keys)(preStackData);
	}

	addEventListeners() {
		const self = this;
		this.parent
			.selectAll("path.area")
			.on("mouseover", function(datum) {
				const hoveredElement = select(this);
				hoveredElement.classed("hovered", true);
				hoveredElement
					.transition(
						self.services.transitions.getTransition(
							"graph_element_mouseover_fill_update"
						)
					)
					.attr(
						"fill",
						color(hoveredElement.attr("fill"))
							.darker(0.2)
							.toString()
					);

				// Dispatch mouse event
				self.services.events.dispatchEvent(Events.Area.AREA_MOUSEOVER, {
					element: hoveredElement,
					datum
				});

				// self.services.events.dispatchEvent("show-tooltip", {
				// 	hoveredElement,
				// 	type: TooltipTypes.DATAPOINT
				// });
			})
			.on("mouseout", function(datum) {
				const hoveredElement = select(this);
				hoveredElement.classed("hovered", false);

				hoveredElement
					.transition(
						self.services.transitions.getTransition(
							"graph_element_mouseout_fill_update"
						)
					)
					.attr("fill", (d: any) => self.model.getFillColor(d[0].group));

				// Dispatch mouse event
				self.services.events.dispatchEvent(Events.Area.AREA_MOUSEOUT, {
					element: hoveredElement,
					datum
				});

				// Hide tooltip
				// 	self.services.events.dispatchEvent("hide-tooltip", {
				// 		hoveredElement
				// 	});
			});
	}

	destroy() {
		// Remove event listeners
		this.parent
			.selectAll("path.area")
			.on("mouseover", null)
			.on("mousemove", null)
			.on("mouseout", null);
	}

	render(animate = true) {
		const svg = this.getContainerSVG();
		const self = this;

		const mainXScale = this.services.cartesianScales.getMainXScale();
		const mainYScale = this.services.cartesianScales.getMainYScale();

		const domainAxisPosition = this.services.cartesianScales.getDomainAxisPosition();
		const domainScaleType = this.services.cartesianScales.getScaleTypeByPosition(
			domainAxisPosition
		);
		const isTimeSeries = domainScaleType === ScaleTypes.TIME;

		if (!isTimeSeries) {
			return;
		}

		const stackedData = this.model.getStackedData();
		console.log(stackedData);

		const areaGroups = svg
			.selectAll("g.areas")
			.data(stackedData, d => d[0].group);

		// D3 area generator function
		this.areaGenerator = area()
			// @ts-ignore
			.x(d => mainXScale(d.data.date))
			.y0(d => {
				return mainYScale(d[0]);
			})
			.y1(d => mainYScale(d[1]))
			.curve(this.services.curves.getD3Curve());

		areaGroups
			.exit()
			.attr("opacity", 0)
			.remove();

		const enteringAreaGroups = areaGroups
			.enter()
			.append("g")
			.classed("areas", true);

		const enteringPaths = enteringAreaGroups
			.append("path")
			.attr("opacity", 0);

		enteringPaths
			.merge(svg.selectAll("g.areas path"))
			.data(stackedData, d => d[0].group)
			.attr("fill", d => self.model.getFillColor(d[0].group))
			// .datum(function(d) {
			// 	console.log(d);
			// 	this._datasetLabel = d[0].group;
			// 	return d[0].data;
			// })
			.attr("role", Roles.GRAPHICS_SYMBOL)
			.attr("aria-roledescription", "area")
			// .attr("aria-label", d =>
			// 	d.map(datum => datum.value || datum).join(",")
			// )
			.transition(
				this.services.transitions.getTransition(
					"area-update-enter",
					animate
				)
			)
			.attr("opacity", 1)
			.attr("class", "area")
			.attr("d", this.areaGenerator);

		// Add event listeners to elements drawn
		this.addEventListeners();
	}
}
