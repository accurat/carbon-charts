// Internal Imports
import { AxisChart } from "../axis-chart";
import * as Configuration from "../configuration";
import { ChartConfig, AxisChartOptions } from "../interfaces/index";
import { Tools } from "../tools";
import { HeatmapChartModel } from "../model-heatmap";

// Components
import {
	Grid,
	Heatmap,
	TwoDimensionalAxes,
	HorizontalZeroLine,
	TooltipBar
} from "../components/index";

export class HeatmapChart extends AxisChart {
	model = new HeatmapChartModel(this.services);

	constructor(holder: Element, chartConfigs: ChartConfig<AxisChartOptions>) {
		super(holder, chartConfigs);

		// Merge the default options for this chart
		// With the user provided options
		this.model.setOptions(
			Tools.merge(Tools.clone(Configuration.options.heatmapChart), chartConfigs.options)
		);

		// Initialize data, services, components etc.
		this.init(holder, chartConfigs);
	}

	getComponents() {
		// Specify what to render inside the graph-frame
		const graphFrameComponents = [
			new TwoDimensionalAxes(this.model, this.services),
			// new Grid(this.model, this.services),
			new Heatmap(this.model, this.services)
			// new HorizontalZeroLine(this.model, this.services)
		];

		const components: any[] = this.getAxisChartComponents(graphFrameComponents);
		components.push(new TooltipBar(this.model, this.services));
		return components;
	}
}
