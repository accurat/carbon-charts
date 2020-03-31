// Internal Imports
import * as Configuration from "../configuration";
import { Service } from "./service";
import { AxisPositions, CartesianOrientations, ScaleTypes, AxesOptions } from "../interfaces";
import { Tools } from "../tools";

// D3 Imports
import {
	scaleBand,
	scaleLinear,
	scaleTime,
	scaleLog
} from "d3-scale";
import { min, extent } from "d3-array";

// Misc
import {
	differenceInYears,
	addYears,
	subYears,
	differenceInMonths,
	addMonths,
	subMonths,
	differenceInDays,
	addDays,
	subDays,
	differenceInHours,
	addHours,
	subHours,
	differenceInMinutes,
	addMinutes,
	subMinutes,
	differenceInSeconds,
	subSeconds,
	addSeconds
} from "date-fns";

function addPaddingInDomain([lower, upper]: number[], paddingRatio: number) {
	const domainLength = upper - lower;
	const padding = domainLength * paddingRatio;

	// If padding crosses 0, keep 0 as new upper bound
	const newUpper = upper <= 0 && upper + padding > 0 ? 0 : upper + padding;
	// If padding crosses 0, keep 0 as new lower bound
	const newLower = lower >= 0 && lower - padding < 0 ? 0 : lower - padding;

	return [newLower, newUpper];
}

export class CartesianScales extends Service {
	protected scaleTypes = {
		top: null,
		right: null,
		bottom: null,
		left: null
	};

	protected scales = {
		top: null,
		right: null,
		bottom: null,
		left: null
	};

	protected domainAxisPosition: AxisPositions;
	protected rangeAxisPosition: AxisPositions;

	protected orientation: CartesianOrientations;

	getDomainAxisPosition() {
		return this.domainAxisPosition;
	}

	getRangeAxisPosition() {
		return this.rangeAxisPosition;
	}

	setDefaultAxes() {
		const axesOptions = Tools.getProperty(this.model.getOptions(), "axes");
		if (!axesOptions) {
			(this.model.getOptions().axes as AxesOptions) = {
				left: {
					primary: true,
					includeZero: true,
				},
				bottom: {
					secondary: true,
					includeZero: true,
					scaleType: this.model.getDisplayData().labels ? ScaleTypes.LABELS : undefined
				}
			};
		}
	}

	update(animate = true) {
		this.setDefaultAxes();
		this.determineOrientation();
		const axisPositions = Object.keys(AxisPositions).map(axisPositionKey => AxisPositions[axisPositionKey]);
		axisPositions.forEach(axisPosition => {
			this.scales[axisPosition] = this.createScale(axisPosition);
		});
	}

	determineOrientation() {
		const options = this.model.getOptions();

		// Manually specifying positions here
		// In order to enforce a priority
		[
			AxisPositions.LEFT,
			AxisPositions.BOTTOM,
			AxisPositions.RIGHT,
			AxisPositions.TOP
		].forEach(axisPosition => {
			const axisOptions = Tools.getProperty(options, "axes", axisPosition);

			if (axisOptions) {
				const scaleType = axisOptions.scaleType || ScaleTypes.LINEAR;
				this.scaleTypes[axisPosition] = scaleType;

				if (scaleType === ScaleTypes.LINEAR) {
					this.rangeAxisPosition = axisPosition;
				} else {
					this.domainAxisPosition = axisPosition;
				}
			}
		});

		if (this.rangeAxisPosition === AxisPositions.LEFT && this.domainAxisPosition === AxisPositions.BOTTOM) {
			this.orientation = CartesianOrientations.VERTICAL;
		} else {
			this.orientation = CartesianOrientations.HORIZONTAL;
		}
	}

	getOrientation() {
		return this.orientation;
	}

	getScaleByPosition(axisPosition: AxisPositions) {
		return this.scales[axisPosition];
	}

	getScaleTypeByPosition(axisPosition: AxisPositions) {
		return this.scaleTypes[axisPosition];
	}

	getDomainScale() {
		return this.scales[this.domainAxisPosition];
	}

	getRangeScale() {
		return this.scales[this.rangeAxisPosition];
	}

	// Find the main x-axis out of the 2 x-axis on the chart (when 2D axis is used)
	getMainXAxisPosition() {
		const possibleXAxisPositions = [AxisPositions.BOTTOM, AxisPositions.TOP];

		return [this.domainAxisPosition, this.rangeAxisPosition]
			.find(position => possibleXAxisPositions.indexOf(position) > -1);
	}

	// Find the main y-axis out of the 2 y-axis on the chart (when 2D axis is used)
	getMainYAxisPosition() {
		const possibleYAxisPositions = [AxisPositions.LEFT, AxisPositions.RIGHT];

		return [this.domainAxisPosition, this.rangeAxisPosition]
			.find(position => possibleYAxisPositions.indexOf(position) > -1);
	}

	getMainXScale() {
		return this.scales[this.getMainXAxisPosition()];
	}

	getMainYScale() {
		return this.scales[this.getMainYAxisPosition()];
	}

	getValueFromScale(axisPosition: AxisPositions, datum: any, index?: number) {
		const value = isNaN(datum) ? datum.value : datum;
		const scaleType = this.scaleTypes[axisPosition];
		const scale = this.scales[axisPosition];
		if (scaleType === ScaleTypes.LABELS) {
			const correspondingLabel = this.model.getDisplayData().labels[index];
			return scale(correspondingLabel) + scale.step() / 2;
		} else if (scaleType === ScaleTypes.TIME) {
			return scale(new Date(datum.date || datum.label));
		}

		return scale(value);
	}

	getDomainValue(d, i) {
		return this.getValueFromScale(this.domainAxisPosition, d, i);
	}

	getRangeValue(d, i) {
		return this.getValueFromScale(this.rangeAxisPosition, d, i);
	}

	/** Uses the primary Y Axis to get data items associated with that value.  */
	getDataFromDomain(domainValue) {
		const displayData = this.model.getDisplayData();
		const activePoints = [];
		const scaleType = this.scaleTypes[this.domainAxisPosition];

		switch (scaleType) {
			case ScaleTypes.LABELS:
				// based on labels we use the index to get the associated data
				const index = displayData.labels.indexOf(domainValue);

				displayData.datasets.forEach(dataset => {
					activePoints.push(
						{
							datasetLabel: dataset.label,
							value: dataset.data[index]
						}
					);
				});
				break;
			case ScaleTypes.TIME:
				// time series we filter using the date
				const domainKey = Object.keys(displayData.datasets[0].data[0]).filter(key => key !== "value")[0];

				displayData.datasets.forEach(dataset => {
					const sharedLabel = dataset.label;

					// filter the items in each dataset for the points associated with the Domain
					const dataItems = dataset.data.filter(item => {
						const date1 = new Date(item[domainKey]);
						const date2 = new Date(domainValue);
						return date1.getTime() === date2.getTime();
					});

					// assign the shared label on the data items and add them to the array
					dataItems.forEach(item => {
						activePoints.push(
							Object.assign({
								datasetLabel: sharedLabel,
								value: item.value
							}, item)
						);
					});
				});
				break;
		}
		return activePoints;
	}

	protected getScaleDomain(axisPosition: AxisPositions) {
		const options = this.model.getOptions();
		const axisOptions = Tools.getProperty(options, "axes", axisPosition);
		const { includeZero } = axisOptions;
		const { datasets, labels } = this.model.getDisplayData();

		// If scale is a LABELS scale, return some labels as the domain
		if (axisOptions && axisOptions.scaleType === ScaleTypes.LABELS) {
			if (labels.length) {
				return labels;
			} else {
				return [];
			}
		}

		// Get the extent of the domain
		let domain;

		const areDataEmpty = !dataExistsFn(this.model.getData());

		// If domain is specified return that domain
		if (axisOptions.domain && !areDataEmpty) {
			return axisOptions.domain;
		}

		// If the scale is stacked
		if (axisOptions.stacked) {
			if (!labels.length) {
				domain = [];
			} else {
				domain = extent(
					labels.reduce((m, label: any, i) => {
						const correspondingValues = datasets.map(dataset => {
							return !isNaN(dataset.data[i]) ? dataset.data[i] : dataset.data[i].value;
						});
						const totalValue = correspondingValues.reduce((a, b) => a + b, 0);

						// Save both the total value and the minimum
						return m.concat(totalValue, min(correspondingValues));
					}, [])
						// Currently stack layouts in the library
						// Only support positive values
						.concat(0)
				);
			}
		} else {
			// Get all the chart's data values in a flat array
			let allDataValues = datasets.reduce((dataValues, dataset: any) => {
				dataset.data.forEach((datum: any) => {
					if (axisOptions.scaleType === ScaleTypes.TIME) {
						dataValues = dataValues.concat(datum.date);
					} else {
						dataValues = dataValues.concat(isNaN(datum) ? datum.value : datum);
					}
				});

				return dataValues;
			}, []);
			if (!allDataValues.length) {
				domain = [];
			} else {
				if (axisOptions.scaleType !== ScaleTypes.TIME && includeZero) {
					allDataValues = allDataValues.concat(0);
				}

				domain = extent(allDataValues);
			}
		}

		if (axisOptions.scaleType === ScaleTypes.TIME) {
			const spaceToAddToEdges = Tools.getProperty(options, "timeScale", "addSpaceOnEdges");

			if (spaceToAddToEdges) {
				const startDate = new Date(domain[0]);
				const endDate = new Date(domain[1]);

				if (differenceInYears(endDate, startDate) > 1) {
					return [subYears(startDate, spaceToAddToEdges), addYears(endDate, spaceToAddToEdges)];
				}

				if (differenceInMonths(endDate, startDate) > 1) {
					return [subMonths(startDate, spaceToAddToEdges), addMonths(endDate, spaceToAddToEdges)];
				}

				if (differenceInDays(endDate, startDate) > 1) {
					return [subDays(startDate, spaceToAddToEdges), addDays(endDate, spaceToAddToEdges)];
				}

				if (differenceInHours(endDate, startDate) > 1) {
					return [subHours(startDate, spaceToAddToEdges), addHours(endDate, spaceToAddToEdges)];
				}

				if (differenceInMinutes(endDate, startDate) > 30) {
					return [subMinutes(startDate, spaceToAddToEdges * 30), addMinutes(endDate, spaceToAddToEdges * 30)];
				}

				if (differenceInMinutes(endDate, startDate) > 1) {
					return [subMinutes(startDate, spaceToAddToEdges), addMinutes(endDate, spaceToAddToEdges)];
				}

				if (differenceInSeconds(endDate, startDate) > 15) {
					return [subSeconds(startDate, spaceToAddToEdges * 15), addSeconds(endDate, spaceToAddToEdges * 15)];
				}

				if (differenceInSeconds(endDate, startDate) > 1) {
					return [subSeconds(startDate, spaceToAddToEdges), addSeconds(endDate, spaceToAddToEdges)];
				}

				return [startDate, endDate];
			}

			return [
				new Date(domain[0]),
				new Date(domain[1])
			];
		}

		return addPaddingInDomain(domain, Configuration.axis.paddingRatio);
	}

	protected createScale(axisPosition: AxisPositions) {
		const options = this.model.getOptions();
		const axisOptions = Tools.getProperty(options, "axes", axisPosition);

		if (!axisOptions) {
			return null;
		}

		const scaleType = Tools.getProperty(axisOptions, "scaleType") || ScaleTypes.LINEAR;
		this.scaleTypes[axisPosition] = scaleType;

		let scale;
		if (scaleType === ScaleTypes.TIME) {
			scale = scaleTime();
		} else if (scaleType === ScaleTypes.LOG) {
			scale = scaleLog().base(axisOptions.base || 10);
		} else if (scaleType === ScaleTypes.LABELS) {
			scale = scaleBand();
		} else {
			scale = scaleLinear();
		}

		scale.domain(this.getScaleDomain(axisPosition));

		return scale;
	}
}

// data is { labels: ["", "", ...], datasets: [ {label: "", data: []}, {}, ...] }
export function dataExistsFn(data: { labels: string[], datasets: any[] }) {
	return Object.entries(data).reduce((acc, [key, value]) => {
		const hasValues = value.length > 0;
		return acc && hasValues;
	}, true);
}
