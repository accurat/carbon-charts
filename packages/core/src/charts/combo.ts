// Internal Imports
import { AxisChart } from "../axis-chart";
import * as Configuration from "../configuration";
import {
	ChartConfig,
	ComboChartOptions,
	AxisChartOptions,
	ScatterChartOptions
} from "../interfaces/index";
import { Tools } from "../tools";
import { ChartModel } from "../model";

// Components
import {
	Grid,
	GroupedBar,
	SimpleBar,
	StackedBar,
	Line,
	TwoDimensionalAxes,
	ZeroLine,
	TooltipBar,
	Scatter,
	// the imports below are needed because of typescript bug (error TS4029)
	Tooltip,
	Legend,
	LayoutComponent,
	TooltipScatter
} from "../components/index";

const graphComponentsMap = {
	"line": [Line, Scatter],
	"simpleBar": [SimpleBar, ZeroLine],
	"groupedBar": [GroupedBar, ZeroLine],
	"stackedBar": [StackedBar]
};

const graphTooltipsMap = {
	"line": TooltipScatter,
	"simpleBar": TooltipBar,
	"groupedBar": TooltipBar,
	"stackedBar": TooltipBar
};

export class ComboChart extends AxisChart {
	model = new ChartModel(this.services);
	chartConfigs: any;

	constructor(holder: Element, chartConfigs: ChartConfig<ComboChartOptions>) {
		super(holder, chartConfigs);
		this.chartConfigs = chartConfigs;
		// Merge multiple default options
		const {chartTypes} = chartConfigs.options;
		const graphs = Object.keys(chartTypes);
		const graphsOptions: AxisChartOptions = graphs.reduce((options, g) => Tools.merge(options, Configuration.options[`${g}Chart`]), {});

		// Merge the default options for this chart
		// With the user provided options
		this.model.setOptions(
			Tools.mergeDefaultChartOptions(
				graphsOptions,
				chartConfigs.options
			)
		);

		// Initialize data, services, components etc.
		this.init(holder, chartConfigs);
	}

	getGraphComponents(graph: string) {
		const {chartTypes} = this.model.getOptions();
		return graphComponentsMap[graph]
			.map(Component => new Component(this.model, this.services, {groups: chartTypes[graph]}));
	}

	getGraphsComponents() {
		const {chartTypes} = this.model.getOptions();
		const graphsComponents = Object.keys(chartTypes).map(graph => this.getGraphComponents(graph));
		return Tools.removeArrayDuplicates(Tools.flatten(graphsComponents));
	}

	getGraphsTooltips() {
		const {chartTypes} = this.model.getOptions();
		const graphsTooltips = Object.keys(chartTypes)
			.map(graph => new graphTooltipsMap[graph](this.model, this.services));
		return Tools.removeArrayDuplicates(graphsTooltips);
	}

	getComponents() {
		// Specify what to render inside the graph-frame
		const graphFrameComponents = [
			new TwoDimensionalAxes(this.model, this.services),
			new Grid(this.model, this.services),
			...this.getGraphsComponents()
		];

		const components: any[] = this.getAxisChartComponents(graphFrameComponents);
		components.push(...this.getGraphsTooltips());

		return components;
	}
}
