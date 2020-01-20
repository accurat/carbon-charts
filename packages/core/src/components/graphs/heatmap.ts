// Internal Imports
import { Component } from "../component";
import { TooltipTypes, Roles } from "../../interfaces";

// D3 Imports
import { select } from "d3-selection";
import { color } from "d3-color";
import { Tools } from "../../tools";
import { scaleOrdinal, scaleLinear } from "d3-scale";
import { DOMUtils } from "../../services";
import { uniq } from "lodash-es";
import { extent } from "d3";

interface HeatmapDatum {
	labelX: string;
	labelY: string;
	value: number;
}

export class Heatmap extends Component {
	type = "heatmap";

	getDisplayData() {
		return Tools.clone(this.model.get("data"));
	}

	get data(): HeatmapDatum[] {
		return this.getDisplayData().datasets[0].data;
	}

	get values() {
		return this.data.map(d => d.value);
	}

	getBarWidth = () => {
		const xLabels = uniq(this.data.map(d => d.labelX));
		const { width } = DOMUtils.getSVGElementSize(this.parent, {
			useAttrs: true
		});
		return width / xLabels.length;
	}

	getBarHeight = () => {
		const yLabels = uniq(this.data.map(d => d.labelY));

		const { height } = DOMUtils.getSVGElementSize(this.parent, {
			useAttrs: true
		});
		return height / yLabels.length;
	}

	getXScale = () => {
		const xLabels = uniq(this.data.map(d => d.labelX));

		return scaleOrdinal()
			.domain(xLabels)
			.range(xLabels.map((d, i) => i * this.getBarWidth()));
	}

	getYScale = () => {
		const yLabels = uniq(this.data.map(d => d.labelY));

		return scaleOrdinal()
			.domain(yLabels)
			.range(yLabels.map((d, i) => i * this.getBarHeight()));
	}

	getValueScale = () => {
		return scaleLinear()
			.domain(extent(this.values))
			.range([0, 1]);
	}

	init() {
		const eventsFragment = this.services.events;

		// Highlight correct circle on legend item hovers
		eventsFragment.addEventListener("legend-item-onhover", this.handleLegendOnHover);

		// Un-highlight circles on legend item mouseouts
		eventsFragment.addEventListener("legend-item-onmouseout", this.handleLegendMouseOut);
	}

	render(animate: boolean) {
		// Grab container SVG
		const svg = this.getContainerSVG();
		const rectWidth = this.getBarWidth();
		const rectHeight = this.getBarHeight();
		const xScale = this.getXScale();
		const yScale = this.getYScale();
		const colorScale = this.model.getFillScale();
		const valueScale = this.getValueScale();

		const rectGroups = svg
			.selectAll("g.rects")
			.data(this.getDisplayData().datasets, dataset => dataset.label);

		// Remove dot groups that need to be removed
		rectGroups
			.exit()
			.attr("opacity", 0)
			.remove();

		// Add the rect groups that need to be introduced
		const rectGroupsEnter = rectGroups
			.enter()
			.append("g")
			.classed("rects", true)
			.attr("role", Roles.GROUP);

		// Update data on all rects
		const rects = rectGroupsEnter
			.merge(rectGroups)
			.selectAll("rect.rect")
			.data(this.data);

		// Remove rects that are no longer needed
		rects
			.exit()
			.attr("opacity", 0)
			.remove();

		const rectsEnter = rects
			.enter()
			.append("rect")
			.attr("opacity", 0);

		rectsEnter
			.merge(rects)
			.classed("rect", true)
			.attr("x", (d, i) => {
				return xScale(d.labelX);
			})
			.attr("width", rectWidth)
			.attr("y", (d, i) => {
				return yScale(d.labelY);
			})
			.attr("fill", d => colorScale(valueScale(d.value)))
			.attr("height", rectHeight)
			.attr("opacity", 1)
			// a11y
			.attr("role", Roles.GRAPHICS_SYMBOL)
			.attr("aria-roledescription", "rect")
			.attr("aria-label", d => d.value);

		// Add event listeners to elements drawn
		this.addEventListeners();
	}

	handleLegendOnHover = (event: CustomEvent) => {
		const { hoveredElement } = event.detail;

		this.parent
			.selectAll("rect.rect")
			.transition(this.services.transitions.getTransition("legend-hover-heatmap"))
			.attr("opacity", d => (d.label !== hoveredElement.datum()["key"] ? 0.3 : 1));
	}

	handleLegendMouseOut = (event: CustomEvent) => {
		this.parent
			.selectAll("rect.rect")
			.transition(this.services.transitions.getTransition("legend-mouseout-heatmap"))
			.attr("opacity", 1);
	}

	// TODO - This method could be re-used in more graphs
	addLabelsToDataPoints(d, index) {
		const { labelsX, labelsY } = this.getDisplayData();

		return d.data.map((datum, i) => ({
			date: datum.date,
			label: labelsX[i],
			datasetLabel: d.label,
			value: isNaN(datum) ? datum.value : datum
		}));
	}

	addEventListeners() {
		const self = this;
		const colorScale = this.model.getFillScale();
		const valueScale = this.getValueScale();

		this.parent
			.selectAll("rect.rect")
			.on("mouseover", function() {
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
							.darker(0.7)
							.toString()
					);

				self.services.events.dispatchEvent("show-tooltip", {
					hoveredElement,
					type: TooltipTypes.DATAPOINT
				});
			})
			.on("mouseout", function() {
				const hoveredElement = select(this);
				hoveredElement.classed("hovered", false);

				hoveredElement
					.transition(
						self.services.transitions.getTransition(
							"graph_element_mouseout_fill_update"
						)
					)
					.attr("fill", (d: HeatmapDatum) => colorScale(valueScale(d.value)));

				// Hide tooltip
				self.services.events.dispatchEvent("hide-tooltip", { hoveredElement });
			});
	}

	destroy() {
		// Remove event listeners
		this.parent
			.selectAll("rect.rect")
			.on("mouseover", null)
			.on("mousemove", null)
			.on("mouseout", null);

		// Remove legend listeners
		const eventsFragment = this.services.events;
		eventsFragment.removeEventListener("legend-item-onhover", this.handleLegendOnHover);
		eventsFragment.removeEventListener("legend-item-onmouseout", this.handleLegendMouseOut);
	}
}
