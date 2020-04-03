// Internal Imports
import { Component } from "../component";
import { DOMUtils } from "../../services";
import { Tools } from "../../tools";
import {
	CalloutDirections,
	Roles,
	TooltipTypes,
	Events
} from "../../interfaces";

// D3 Imports
import { select } from "d3-selection";
import { arc, pie } from "d3-shape";
import { interpolate, interpolateNumber } from "d3-interpolate";

// Pie slice tween function
function arcTween(a, arcFunc) {
	const i = interpolate(this._current, a);

	return t => {
		this._current = i(t);
		return arcFunc(this._current);
	};
}

export class Gauge extends Component {
	type = "gauge";

	// We need to store our arcs
	// So that addEventListeners()
	// Can access them
	arc: any;
	hoverArc: any;

	init() {
		const eventsFragment = this.services.events;

		// Highlight correct circle on legend item hovers
		eventsFragment.addEventListener(Events.Legend.ITEM_HOVER, this.handleLegendOnHover);

		// Un-highlight circles on legend item mouseouts
		eventsFragment.addEventListener(Events.Legend.ITEM_MOUSEOUT, this.handleLegendMouseOut);
	}

	getDataList() {
		const displayData = this.model.getDisplayData();
		const dataset = displayData.datasets[0];
		return dataset.data.map((datum, i) => ({
			label: displayData.labels[i],
			value: datum.value ? datum.value : datum
		}));
	}

	render(animate = true) {
		const self = this;
		const svg = this.getContainerSVG();
		const options = this.model.getOptions();
		const dataList = this.getDataList();

		// Compute the outer radius needed
		const radius = this.computeRadius();

		this.arc = arc()
			.innerRadius(this.getInnerRadius())
			.outerRadius(radius);

		// Set the hover arc radius
		this.hoverArc = arc()
			.innerRadius(this.getInnerRadius())
			.outerRadius(radius + options.pie.hoverArc.outerRadiusOffset);

		// Setup the pie layout
		const pieLayout = pie()
			.value((d: any) => d.value)
			.sort(null)
			.padAngle(options.pie.padAngle);

		// Sort pie layout data based off of the indecies the layout creates
		const pieLayoutData = pieLayout(dataList)
			.sort((a: any, b: any) => a.index - b.index);

		// Update data on all slices
		const slicesGroup = DOMUtils.appendOrSelect(svg, "g.slices")
			.attr("role", Roles.GROUP);
		const paths = slicesGroup.selectAll("path.slice")
			.data(pieLayoutData, d => d.data.label);

		// Remove slices that need to be exited
		paths.exit()
			.attr("opacity", 0)
			.remove();

		// Add new slices that are being introduced
		const enteringPaths = paths.enter()
			.append("path")
			.classed("slice", true)
			.attr("opacity", 0);

		// Update styles & position on existing and entering slices
		enteringPaths.merge(paths)
			.attr("fill", d => this.model.getFillScale()(d.data.label))
			.attr("d", this.arc)
			.transition(this.services.transitions.getTransition("pie-slice-enter-update", animate))
			.attr("opacity", 1)
			// a11y
			.attr("role", Roles.GRAPHICS_SYMBOL)
			.attr("aria-roledescription", "slice")
			.attr("aria-label", d => `${d.value}, ${Tools.convertValueToPercentage(d.data.value, dataList) + "%"}`)
			// Tween
			.attrTween("d", function (a) {
				return arcTween.bind(this)(a, self.arc);
			});

		// Draw the slice labels
		const labelsGroup = DOMUtils.appendOrSelect(svg, "g.labels").attr("role", Roles.GROUP);
		const labels = labelsGroup.selectAll("text.pie-label")
			.data(pieLayoutData, (d: any) => d.data.label);

		// Remove labels that are existing
		labels.exit()
			.attr("opacity", 0)
			.remove();

		// Add labels that are being introduced
		const enteringLabels = labels.enter()
			.append("text")
			.classed("pie-label", true);

		// Update styles & position on existing & entering labels
		const calloutData = [];
		enteringLabels.merge(labels)
			.style("text-anchor", "middle")
			.text(d => {
				if (options.pie.labels.formatter) {
					return options.pie.labels.formatter(d);
				}

				return Tools.convertValueToPercentage(d.data.value, dataList) + "%";
			})
			// Calculate dimensions in order to transform
			.datum(function (d) {
				const textLength = this.getComputedTextLength();
				d.textOffsetX = textLength / 2;
				d.textOffsetY = parseFloat(getComputedStyle(this).fontSize) / 2;

				const marginedRadius = radius + 7;

				const theta = ((d.endAngle - d.startAngle) / 2) + d.startAngle;

				d.xPosition = (d.textOffsetX + marginedRadius) * Math.sin(theta);
				d.yPosition = (d.textOffsetY + marginedRadius) * -Math.cos(theta);

				return d;
			})
			.attr("transform", function (d, i) {
				const totalSlices = dataList.length;
				const sliceAngleDeg = (d.endAngle - d.startAngle) * (180 / Math.PI);

				// check if last 2 slices (or just last) are < the threshold
				if (i >= totalSlices - 2) {
					if (sliceAngleDeg < options.pie.callout.minSliceDegree) {
						let labelTranslateX, labelTranslateY;
						if (d.index === totalSlices - 1) {
							labelTranslateX = d.xPosition + options.pie.callout.offsetX + options.pie.callout.textMargin + d.textOffsetX;
							labelTranslateY = d.yPosition - options.pie.callout.offsetY;

							// Set direction of callout
							d.direction = CalloutDirections.RIGHT;
							calloutData.push(d);
						} else {
							labelTranslateX = d.xPosition - options.pie.callout.offsetX - d.textOffsetX - options.pie.callout.textMargin;
							labelTranslateY = d.yPosition - options.pie.callout.offsetY;

							// Set direction of callout
							d.direction = CalloutDirections.LEFT;
							calloutData.push(d);
						}

						return `translate(${labelTranslateX}, ${labelTranslateY})`;
					}
				}

				return `translate(${d.xPosition}, ${d.yPosition})`;
			});

		// Render pie label callouts
		this.renderCallouts(calloutData);

		// Position Pie
		const pieTranslateX = radius + options.pie.xOffset;
		let pieTranslateY = radius + options.pie.yOffset;
		if (calloutData.length > 0) {
			pieTranslateY += options.pie.yOffsetCallout;
		}
		svg.attr("transform", `translate(${pieTranslateX}, ${pieTranslateY})`);

		// Add the number shown in the center of the donut
		DOMUtils.appendOrSelect(svg, "text.donut-figure")
			.attr("text-anchor", "middle")
			.style("font-size", () => options.gauge.center.numberFontSize(radius))
			.transition(this.services.transitions.getTransition("donut-figure-enter-update", animate))
			.tween("text", function () {
				return self.centerNumberTween(select(this));
			});

		// Add the label below the number in the center of the donut
		DOMUtils.appendOrSelect(svg, "text.donut-title")
			.attr("text-anchor", "middle")
			.style("font-size", () => options.gauge.center.titleFontSize(radius))
			.attr("y", options.gauge.center.titleYPosition(radius))
			.text(Tools.getProperty(options, "donut", "center", "label"));


		// Add event listeners
		this.addEventListeners();
	}


	getInnerRadius() {
		// Compute the outer radius needed
		const radius = this.computeRadius();

		return radius * (3 / 4);
	}

	centerNumberTween(d3Ref) {
		const options = this.model.getOptions();

		let donutCenterFigure = Tools.getProperty(options, "donut", "center", "number");
		if (!donutCenterFigure) {
			donutCenterFigure = this.getDataList().reduce((accumulator, d) => {
				return accumulator + d.value;
			}, 0);
		}

		// Remove commas from the current value string, and convert to an int
		const currentValue = parseInt(d3Ref.text().replace(/[, ]+/g, ""), 10) || 0;
		const i = interpolateNumber(currentValue, donutCenterFigure);

		return t => {
			const { numberFormatter } = options.gauge.center;
			d3Ref.text(numberFormatter(i(t)));
		};
	}

	renderCallouts(calloutData: any[]) {
		const svg = DOMUtils.appendOrSelect(this.getContainerSVG(), "g.callouts")
			.attr("role", Roles.GROUP);
		const options = this.model.getOptions();

		// Update data on callouts
		const callouts = svg.selectAll("g.callout")
			.data(calloutData);

		callouts.exit().remove();

		const enteringCallouts = callouts.enter()
			.append("g")
			.classed("callout", true)
			// a11y
			.attr("role", `${Roles.GRAPHICS_SYMBOL} ${Roles.GROUP}`)
			.attr("aria-roledescription", "label callout");

		// Update data values for each callout
		// For the horizontal and vertical lines to use
		enteringCallouts.merge(callouts)
			.datum(function (d) {
				const { xPosition, yPosition, direction } = d;

				if (direction === CalloutDirections.RIGHT) {
					d.startPos = {
						x: xPosition,
						y: yPosition + d.textOffsetY
					};

					// end position for the callout line
					d.endPos = {
						x: xPosition + options.pie.callout.offsetX,
						y: yPosition - options.pie.callout.offsetY + d.textOffsetY
					};

					// the intersection point of the vertical and horizontal line
					d.intersectPointX = d.endPos.x - options.pie.callout.horizontalLineLength;
				} else {
					// start position for the callout line
					d.startPos = {
						x: xPosition,
						y: yPosition + d.textOffsetY
					};

					// end position for the callout line should be bottom aligned to the title
					d.endPos = {
						x: xPosition - options.pie.callout.offsetX,
						y: yPosition - options.pie.callout.offsetY + d.textOffsetY
					};

					// the intersection point of the vertical and horizontal line
					d.intersectPointX = d.endPos.x + options.pie.callout.horizontalLineLength;
				}

				// Store the necessary data in the DOM element
				return d;
			});

		// draw vertical line
		const enteringVerticalLines = enteringCallouts.append("line")
			.classed("vertical-line", true);

		enteringVerticalLines.merge(svg.selectAll("line.vertical-line"))
			.datum(function (d: any) {
				return select(this.parentNode).datum();
			})
			.style("stroke-width", "1px")
			.attr("x1", d => d.startPos.x)
			.attr("y1", d => d.startPos.y)
			.attr("x2", d => d.intersectPointX)
			.attr("y2", d => d.endPos.y);

		// draw horizontal line
		const enteringHorizontalLines = enteringCallouts.append("line")
			.classed("horizontal-line", true);

		enteringHorizontalLines.merge(callouts.selectAll("line.horizontal-line"))
			.datum(function (d: any) {
				return select(this.parentNode).datum();
			})
			.style("stroke-width", "1px")
			.attr("x1", d => d.intersectPointX)
			.attr("y1", d => d.endPos.y)
			.attr("x2", d => d.endPos.x)
			.attr("y2", d => d.endPos.y);
	}

	// Highlight elements that match the hovered legend item
	handleLegendOnHover = (event: CustomEvent) => {
		const { hoveredElement } = event.detail;

		this.parent.selectAll("path.slice")
			.transition(this.services.transitions.getTransition("legend-hover-bar"))
			.attr("opacity", d => (d.data.label !== hoveredElement.datum()["key"]) ? 0.3 : 1);
	}

	// Un-highlight all elements
	handleLegendMouseOut = (event: CustomEvent) => {
		this.parent.selectAll("path.slice")
			.transition(this.services.transitions.getTransition("legend-mouseout-bar"))
			.attr("opacity", 1);
	}

	addEventListeners() {
		const self = this;
		this.parent.selectAll("path.slice")
			.on("mouseover", function (datum) {
				// Dispatch mouse event
				self.services.events.dispatchEvent(Events.Pie.SLICE_MOUSEOVER, {
					element: select(this),
					datum
				});
			})
			.on("mousemove", function (datum) {
				const hoveredElement = select(this);

				hoveredElement.classed("hovered", true)
					.transition(self.services.transitions.getTransition("pie_slice_mouseover"))
					.attr("d", self.hoverArc);

				// Dispatch mouse event
				self.services.events.dispatchEvent(Events.Pie.SLICE_MOUSEMOVE, {
					element: hoveredElement,
					datum
				});

				// Show tooltip
				self.services.events.dispatchEvent(Events.Tooltip.SHOW, {
					hoveredElement,
					type: TooltipTypes.DATAPOINT
				});
			})
			.on("click", function (datum) {
				// Dispatch mouse event
				self.services.events.dispatchEvent(Events.Pie.SLICE_CLICK, {
					element: select(this),
					datum
				});
			})
			.on("mouseout", function (datum) {
				const hoveredElement = select(this);
				hoveredElement.classed("hovered", false)
					.transition(self.services.transitions.getTransition("pie_slice_mouseover"))
					.attr("d", self.arc);

				// Dispatch mouse event
				self.services.events.dispatchEvent(Events.Pie.SLICE_MOUSEOUT, {
					element: hoveredElement,
					datum
				});

				// Hide tooltip
				self.services.events.dispatchEvent(Events.Tooltip.HIDE, { hoveredElement });
			});
	}

	// Helper functions
	protected computeRadius() {
		const options = this.model.getOptions();

		const { width, height } = DOMUtils.getSVGElementSize(this.parent, { useAttrs: true });
		const radius: number = Math.min(width, height) / 2;

		return radius + options.pie.radiusOffset;
	}
}
