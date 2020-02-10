import React from "react";

import { StackedBarChart as SBC } from "@carbon/charts";
import BaseChart from "./base-chart";

export default class StackedBarChart extends BaseChart {
	componentDidMount() {
		this.chart = new SBC(this.chartRef, {
			data: this.props.data,
			options: this.props.options,
		});
	}

	render() {
		return <div ref={chartRef => (this.chartRef = chartRef)} className="chart-holder" />;
	}
}
