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
import { stack } from "d3";

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

export class ComboModel extends ChartModel {
	filter: Function;

	constructor(services: any) {
		super(services);
		this.filter = (x) => x;
	}

	setDataFilter(filter) {
		this.filter = filter;
	}

	getData() {
		return this.filter(this.get("data"));
	}
}

export class ComboChart extends AxisChart {
	model = new ComboModel(this.services);
	models: any = {};

	constructor(holder: Element, chartConfigs: ChartConfig<ComboChartOptions>) {
		super(holder, chartConfigs);

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

	update(animate = true) {
		if (!this.components) { return; }
		// Re-create graphs components
		this.components = [...this.components.slice(0, 1), ...this.updateComponents()];
		super.update(animate);
	}

	setGraphsModels() {
		// Init graphs models
		const {chartTypes} = this.model.getOptions();
		Object.keys(chartTypes).map(graph => {
			const model = Tools.clone(this.model);
			model.setDataFilter(this.filterDataset(graph));
			this.models[graph] = model;
		});
	}

	filterDataset = (chart) => (dataset) => {
		const {chartTypes} = this.model.getOptions();
		const chartGroups = chartTypes[chart];
		return dataset.filter(d => chartGroups.includes(d.group));
	}

	getGraphComponents(graph: string) {
		return graphComponentsMap[graph].map(component => new component(this.models[graph], this.services));
	}

	getGraphsComponents() {
		const {chartTypes} = this.model.getOptions();
		const graphsComponents = Object.keys(chartTypes).map(graph => this.getGraphComponents(graph));
		return Tools.removeArrayDuplicates(Tools.flatten(graphsComponents));
	}

	getGraphsTooltips() {
		const {chartTypes} = this.model.getOptions();
		const graphsTooltips = Object.keys(chartTypes).map(graph => new graphTooltipsMap[graph](this.models[graph], this.services));
		return Tools.removeArrayDuplicates(graphsTooltips);
	}

	updateComponents() {
		this.setGraphsModels();
		return this.getGraphsComponents();
	}

	getComponents() {
		this.setGraphsModels();

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
